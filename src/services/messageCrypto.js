import { apiClient } from "./apiClient";

// End-to-end encryption for message bodies. The server stores `Message.Content` as an opaque string and
// never sees a private key: every message travels as ciphertext wrapped for each device either
// participant owns, so the sender's other tabs can read their own send (the Step 16 echo) and a second
// device of the recipient can read it too.
//
// Format: `ENC:v1:` + base64 of a JSON envelope
//   { v: 1, alg, e, iv, ct, w: [{ d, k }] }
//     e  - the per-message ephemeral P-256 public key (one per message, so a wrap compromise does not
//          open other messages)
//     iv - 12-byte AES-GCM IV for the content
//     ct - AES-GCM ciphertext of the UTF-8 plaintext (the tag is appended by WebCrypto)
//     w  - one entry per target device: `d` is the device id, `k` is base64(iv || wrapped CEK), the
//          content key encrypted under a key derived by ECDH(ephemeral, that device's public key)
//          -> HKDF-SHA256 -> AES-GCM.
//
// A content without the prefix is legacy plaintext (all history from before this landed) and is shown
// as-is, which is also the owner-approved fallback when the other person has published no key yet:
// messaging must never break during rollout.

export const ENC_PREFIX = "ENC:v1:";

// The server caps the *envelope* at 12000 (the column is longtext; the controller owns the limit). Base64
// of the plaintext is ~+33%, the JSON envelope and IV/tag add a couple of hundred characters, and each
// device either participant owns adds a ~250-character wrap — a 36-character device id plus a 12-byte IV
// and a 32-byte wrapped key, both base64. 4000 characters with four devices total lands around 7.9 KB, so
// it clears 12000 with room for a few more devices per side.
export const MAX_PLAINTEXT_LENGTH = 4000;

const UNREADABLE = "[Can't decrypt this message]";

const HKDF_INFO = utf8("CircleHub v1 message key wrap");
const EMPTY_SALT = new Uint8Array(0);
const DEVICE_ID_KEY = "circlehub-device-id";
const USER_DATA_KEY = "user-data"; // AuthContext's own cache, the signed-in username lives here

// Decrypted bodies keyed by their ciphertext: the same message is rendered by the thread, the copy
// button and sometimes a refetch, and none of that should re-run WebCrypto. Bounded so a long session
// cannot grow it without end.
const decryptCache = new Map();
const settledCache = new Map();
const DECRYPT_CACHE_LIMIT = 1000;

// How long to wait for the vault before giving up on persistence entirely. `indexedDB.open` can sit with
// no event at all (see `openStore`), so every part of the key path is bounded rather than trusted to fire.
const STORE_OPEN_TIMEOUT_MS = 3000;

/* ------------------------------------------------------------------ encoding */

function utf8(text) {
    return new TextEncoder().encode(text);
}

function toBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function fromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

function randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}

/* ------------------------------------------------------------------ key store */

// IndexedDB holds CryptoKey objects by structured clone, so the private key can be generated
// non-extractable and still survives a reload — it can never be read back out as bytes, only used.
// Two tabs of the same browser share one store, which is also how the two-tabs-publish-at-once race
// heals: whichever key ended up published, the other tab finds its private half here.
let storePromise = null;
let memoryFallback = null;

function openStore() {
    if (memoryFallback) return Promise.resolve(null);
    if (!storePromise) {
        storePromise = new Promise((resolve) => {
            if (!("indexedDB" in window)) {
                memoryFallback = [];
                resolve(null);
                return;
            }

            // The fallback is also a deadline. A wedged database — a pending delete from another tab, a
            // profile that lost storage, private browsing — can leave `open` with *no* event at all: not
            // success, not error, not even `blocked`. Without a bound, `ensureDeviceKey` would never
            // settle, and since the send path awaits it the composer would hang and the message would
            // never go out. Falling back to memory keeps messaging working; the only cost is that
            // messages from a previous session stay unreadable in this tab.
            const giveUp = setTimeout(() => {
                if (settled) return;
                settled = true;
                memoryFallback = memoryFallback ?? [];
                storePromise = null;
                resolve(null);
            }, STORE_OPEN_TIMEOUT_MS);

            let settled = false;
            const finish = (db) => {
                if (settled) return;
                settled = true;
                clearTimeout(giveUp);
                resolve(db);
            };

            const request = indexedDB.open("circlehub-keyvault", 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore("privateKeys", { keyPath: "localId" });
            };
            request.onsuccess = () => finish(request.result);
            request.onerror = () => {
                // No persistent vault (private browsing, blocked storage): keep keys in memory for the
                // life of the tab instead. Old messages that were wrapped to a lost key render as the
                // unreadable placeholder rather than breaking the thread.
                memoryFallback = [];
                storePromise = null;
                finish(null);
            };
            request.onblocked = () => {
                // Another connection is holding the upgrade back; stop waiting for it.
                memoryFallback = memoryFallback ?? [];
                storePromise = null;
                finish(null);
            };
        });
    }
    return storePromise;
}

async function loadStoredKeys() {
    const db = await openStore();
    if (!db) return memoryFallback ?? [];

    // A transaction against a wedged database fires no event either, and a decrypt that never settles
    // renders an empty bubble forever. Treat a stalled read as "nothing stored".
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(memoryFallback ?? []), STORE_OPEN_TIMEOUT_MS);
        const finish = (value) => {
            clearTimeout(timer);
            resolve(value);
        };

        try {
            const request = db.transaction("privateKeys", "readonly").objectStore("privateKeys").getAll();
            request.onsuccess = () => finish(request.result ?? []);
            request.onerror = () => finish(memoryFallback ?? []);
        } catch {
            finish(memoryFallback ?? []);
        }
    });
}

async function saveStoredKey(record) {
    const db = await openStore();

    // Always keep a copy in memory as well: it makes the session work even if the write never lands, and
    // the vault is only ever a cache of what the server will be told about anyway.
    memoryFallback = memoryFallback ?? [];
    memoryFallback.push(record);

    if (!db) return;

    await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, STORE_OPEN_TIMEOUT_MS);
        const finish = (error) => {
            clearTimeout(timer);
            if (error) reject(error);
            else resolve();
        };

        try {
            const request = db.transaction("privateKeys", "readwrite").objectStore("privateKeys").put(record);
            request.onsuccess = () => finish(null);
            request.onerror = () => finish(request.error);
        } catch (error) {
            finish(error);
        }
    });
}

export function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

function currentUsername() {
    try {
        const cached = localStorage.getItem(USER_DATA_KEY);
        if (cached) return JSON.parse(cached)?.username ?? null;
    } catch {
        // fall through to the token claim below
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const claims = JSON.parse(atob(token.split(".")[1]));
        return claims.unique_name ?? null;
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ device keys */

async function createAndStoreKey(deviceId) {
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, [
        "deriveKey",
        "deriveBits",
    ]);
    const raw = await crypto.subtle.exportKey("raw", pair.publicKey);
    const record = {
        localId: crypto.randomUUID(),
        deviceId,
        publicKeyB64: toBase64(new Uint8Array(raw)),
        privateKey: pair.privateKey,
        createdAt: Date.now(),
    };
    await saveStoredKey(record);
    return record;
}

async function fetchDeviceKeys(username) {
    if (!username) return [];
    try {
        const response = await apiClient.get(`/keys/${encodeURIComponent(username)}`);
        return response.data?.data ?? [];
    } catch (error) {
        // 403 (the policy refuses this sender) or 404: treat as "no keys", which sends plaintext —
        // the message itself would be refused anyway, so nothing leaks that a send could succeed.
        if (error.response) return [];
        throw error;
    }
}

async function publishKey(deviceId, publicKey) {
    await apiClient.post("/keys", { deviceId, publicKey });
}

/**
 * Makes sure this browser has a keypair, its private half is available, and the public half is the
 * one the server has published. Returns the local record plus the full published list for this user
 * (all devices), which is what a message has to be wrapped for.
 *
 * Concurrent callers share one in-flight run: React StrictMode mounts the publisher twice and a send can
 * happen while that is still going, and without this both would see "nothing published yet" and each
 * generate a key, leaving two records for one device id.
 */
let ensurePromise = null;

export function ensureDeviceKey() {
    if (!ensurePromise) {
        ensurePromise = runEnsureDeviceKey().finally(() => {
            ensurePromise = null;
        });
    }
    return ensurePromise;
}

async function runEnsureDeviceKey() {
    const username = currentUsername();
    if (!username) throw new Error("Not signed in");

    const deviceId = getDeviceId();
    const stored = await loadStoredKeys();
    const published = await fetchDeviceKeys(username);
    const mine = published.find((key) => key.deviceId === deviceId);

    if (mine) {
        const record = stored.find((entry) => entry.publicKeyB64 === mine.publicKey);
        if (record) return { record, published };

        // The public key is on the server but its private half is gone (storage cleared since): rotate
        // by publishing a fresh key here. Old messages wrapped to the lost key stay unreadable; new
        // ones wrap to this one.
        const fresh = await createAndStoreKey(deviceId);
        await publishKey(deviceId, fresh.publicKeyB64);
        return {
            record: fresh,
            published: [...published.filter((key) => key.deviceId !== deviceId), fresh],
        };
    }

    // Nothing published for this device yet. Prefer a key this device already generated (an upload that
    // failed, or another tab that generated while this call was in flight) over making yet another: the
    // private halves share one store, so adopting one is always at least as good as generating.
    const ours = stored
        .filter((entry) => entry.deviceId === deviceId)
        .sort((a, b) => b.createdAt - a.createdAt);

    if (ours.length > 0) {
        await publishKey(deviceId, ours[0].publicKeyB64);
        return { record: ours[0], published: [...published, ours[0]] };
    }

    const fresh = await createAndStoreKey(deviceId);

    // Another tab may have published between our fetch and now; last write wins on the server and the
    // loser's private half is still in the store, so either key opens the messages.
    await publishKey(deviceId, fresh.publicKeyB64);
    return { record: fresh, published: [...published, fresh] };
}

/* ------------------------------------------------------------------ crypto primitives */

async function importPeerKey(publicKeyB64) {
    return crypto.subtle.importKey(
        "raw",
        fromBase64(publicKeyB64),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        [],
    );
}

async function deriveWrapKey(ephemeralPrivateKey, peerPublicKey) {
    const shared = await crypto.subtle.deriveBits(
        { name: "ECDH", public: peerPublicKey },
        ephemeralPrivateKey,
        256,
    );
    const key = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt: EMPTY_SALT, info: HKDF_INFO },
        key,
        256,
    );
    return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function importAesKey(rawBytes) {
    return crypto.subtle.importKey("raw", rawBytes, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
    ]);
}

/* ------------------------------------------------------------------ send path */

export function isEncryptedContent(content) {
    return typeof content === "string" && content.startsWith(ENC_PREFIX);
}

/**
 * Turns message text into the string that goes on the wire. Returns the plaintext untouched when the
 * recipient has published no keys (owner-approved: messaging must never block during rollout) — that
 * is also what every message looked like before this landed.
 */
export async function encryptMessageContent({ recipientUsername, plaintext }) {
    if (!plaintext) return plaintext;

    if (plaintext.length > MAX_PLAINTEXT_LENGTH) {
        throw new Error(`Messages can be at most ${MAX_PLAINTEXT_LENGTH} characters`);
    }

    const recipientKeys = await fetchDeviceKeys(recipientUsername);
    if (recipientKeys.length === 0) return plaintext;

    const { published: ownKeys } = await ensureDeviceKey();

    // Dedupe: a user messaging themselves (or the same key listed twice) must not get two wraps.
    const targets = new Map();
    for (const key of [...ownKeys, ...recipientKeys]) {
        targets.set(`${key.deviceId}|${key.publicKey}`, key);
    }

    const contentKey = randomBytes(32);
    const iv = randomBytes(12);
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            await importAesKey(contentKey),
            utf8(plaintext),
        ),
    );

    // One ephemeral keypair per message: the wrap keys are all derived from it, so learning one
    // message's wrap key never opens another message.
    const ephemeral = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"],
    );
    const ephemeralB64 = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey)));

    const wraps = [];
    for (const target of targets.values()) {
        const wrapKey = await deriveWrapKey(ephemeral.privateKey, await importPeerKey(target.publicKey));
        const wrapIv = randomBytes(12);
        const wrapped = new Uint8Array(
            await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, wrapKey, contentKey),
        );
        wraps.push({ d: target.deviceId, k: toBase64(concat(wrapIv, wrapped)) });
    }

    const envelope = JSON.stringify({
        v: 1,
        alg: "ECDH-P256+HKDF-SHA256+AES-256-GCM",
        e: ephemeralB64,
        iv: toBase64(iv),
        ct: toBase64(ciphertext),
        w: wraps,
    });

    return ENC_PREFIX + toBase64(utf8(envelope));
}

/* ------------------------------------------------------------------ receive path */

async function decryptEnvelope(envelope) {
    if (!envelope || envelope.v !== 1 || !envelope.e || !Array.isArray(envelope.w)) {
        return UNREADABLE;
    }

    const ephemeralPublicKey = await importPeerKey(envelope.e);
    const keys = await loadStoredKeys();
    const contentIv = fromBase64(envelope.iv);
    const ciphertext = fromBase64(envelope.ct);

    // Try every local private key against every wrap until the AEAD tag accepts one: the wrap names a
    // device id, but matching on the id alone would break if a device rotated its key, and the tag is
    // the only check that actually proves the key is right.
    for (const record of keys) {
        for (const wrap of envelope.w) {
            try {
                const wrapKey = await deriveWrapKey(record.privateKey, ephemeralPublicKey);
                const packed = fromBase64(wrap.k);
                const contentKey = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: packed.slice(0, 12) },
                    wrapKey,
                    packed.slice(12),
                );
                const plaintext = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: contentIv },
                    await importAesKey(new Uint8Array(contentKey)),
                    ciphertext,
                );
                return new TextDecoder().decode(plaintext);
            } catch {
                // Wrong key for this wrap — keep trying.
            }
        }
    }

    return UNREADABLE;
}

// Rows written by the early verification harness are `ENC:v1:` + plain base64 of the text itself
// (there was no crypto yet). Keep decoding them so those threads stay readable.
function legacyDecode(content) {
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(fromBase64(content.slice(ENC_PREFIX.length)));
    } catch {
        return UNREADABLE;
    }
}

async function decryptFresh(content) {
    let envelope;
    try {
        envelope = JSON.parse(new TextDecoder().decode(fromBase64(content.slice(ENC_PREFIX.length))));
    } catch {
        return legacyDecode(content);
    }
    return decryptEnvelope(envelope);
}

export function decryptMessageContent(content) {
    if (!isEncryptedContent(content)) return Promise.resolve(content ?? "");

    const cached = decryptCache.get(content);
    if (cached) return cached;

    const promise = decryptFresh(content).then((text) => {
        settledCache.set(content, text);
        if (decryptCache.size > DECRYPT_CACHE_LIMIT) {
            const oldest = decryptCache.keys().next().value;
            decryptCache.delete(oldest);
            settledCache.delete(oldest);
        }
        return text;
    });

    decryptCache.set(content, promise);
    return promise;
}

/** Settled plaintext for a ciphertext, or null while it is still (or never) decrypted. */
export function peekDecrypted(content) {
    return settledCache.get(content) ?? null;
}
