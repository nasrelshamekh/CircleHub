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

// The most devices one message is wrapped for. A wrap costs the sender one ECDH and makes the
// envelope bigger for everyone, and the device directory only grows — every reinstall mints a new
// device id — so the list is capped even though the server caps its side of it too.
const MAX_WRAPS = 8;

// How much of that budget the sender's own devices may take. The sender's current device has to be
// in it — it must be able to read its own message after a reload — but a user with eight signed-in
// devices should not squeeze the recipient's copy out of the envelope.
const MAX_OWN_WRAPS = 2;

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
let cacheVersion = 0;
let notifyPending = false;
const cacheListeners = new Set();

function notifyDecryptCacheChanged() {
    cacheVersion += 1;
    for (const listener of cacheListeners) {
        listener();
    }
}

function scheduleNotifyDecryptCacheChanged() {
    if (notifyPending) return;
    notifyPending = true;
    queueMicrotask(() => {
        notifyPending = false;
        notifyDecryptCacheChanged();
    });
}

export function subscribeDecryptCache(listener) {
    cacheListeners.add(listener);
    return () => {
        cacheListeners.delete(listener);
    };
}

export function getDecryptCacheVersion() {
    return cacheVersion;
}

if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            keysLoadedFromDb = false;
            notifyDecryptCacheChanged();
        }
    });
}

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

export const PADDING_BLOCK_SIZE = 128;

export function padPlaintext(plaintext) {
    const raw = utf8(plaintext);
    const padLen = PADDING_BLOCK_SIZE - (raw.length % PADDING_BLOCK_SIZE);
    const padded = new Uint8Array(raw.length + padLen);
    padded.set(raw, 0);
    padded.fill(padLen, raw.length);
    return padded;
}

export function unpadPlaintext(padded) {
    if (!padded || padded.length === 0) return "";
    const padLen = padded[padded.length - 1];
    if (padLen < 1 || padLen > PADDING_BLOCK_SIZE || padLen > padded.length) {
        return new TextDecoder().decode(padded);
    }
    for (let i = padded.length - padLen; i < padded.length; i += 1) {
        if (padded[i] !== padLen) {
            return new TextDecoder().decode(padded);
        }
    }
    return new TextDecoder().decode(padded.subarray(0, padded.length - padLen));
}

/* ------------------------------------------------------------------ key store */

// IndexedDB holds CryptoKey objects by structured clone, so the private key can be generated
// non-extractable and still survive a reload — that CryptoKey can be used but not exported. The record
// also carries the raw bytes as `pkcs8B64` so the recovery backup can wrap them (the same-origin
// trade-off documented in AGENTS.md): the non-extractability guarantee covers the CryptoKey, not the row.
// Two tabs of the same browser share one store, which is also how the two-tabs-publish-at-once race
// heals: whichever key ended up published, the other tab finds its private half here.
let storePromise = null;
let loadKeysPromise = null;
let keysLoadedFromDb = false;
let memoryKeys = [];
let memoryDeviceId = null;

function mergeKeyLists(primary, secondary) {
    const byId = new Map();
    for (const entry of [...(primary ?? []), ...(secondary ?? [])]) {
        if (entry?.localId) {
            byId.set(entry.localId, entry);
        }
    }
    return Array.from(byId.values());
}

function openStore() {
    if (!storePromise) {
        storePromise = new Promise((resolve) => {
            if (typeof window === "undefined" || !("indexedDB" in window)) {
                storePromise = null;
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
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                    storePromise = null;
                    keysLoadedFromDb = false;
                };
                finish(db);
            };
            request.onerror = () => {
                storePromise = null;
                finish(null);
            };
            request.onblocked = () => {
                storePromise = null;
                finish(null);
            };
        });
    }
    return storePromise;
}

async function loadStoredKeys() {
    if (keysLoadedFromDb) return memoryKeys;
    if (loadKeysPromise) return loadKeysPromise;

    loadKeysPromise = (async () => {
        const db = await openStore();
        if (!db) return memoryKeys;

        // A transaction against a wedged database fires no event either, and a decrypt that never settles
        // renders an empty bubble forever. Treat a stalled read as whatever we already hold in memory.
        return new Promise((resolve) => {
            const timer = setTimeout(() => resolve(memoryKeys), STORE_OPEN_TIMEOUT_MS);
            const finish = (value, loadedFromStore = false) => {
                clearTimeout(timer);
                memoryKeys = mergeKeyLists(value, memoryKeys);
                if (loadedFromStore) {
                    keysLoadedFromDb = true;
                }
                resolve(memoryKeys);
            };

            try {
                const request = db.transaction("privateKeys", "readonly").objectStore("privateKeys").getAll();
                request.onsuccess = () => finish(request.result ?? [], true);
                request.onerror = () => finish(memoryKeys, false);
            } catch {
                storePromise = null;
                finish(memoryKeys, false);
            }
        });
    })().finally(() => {
        loadKeysPromise = null;
    });

    return loadKeysPromise;
}

async function saveStoredKey(record) {
    // Always keep a copy in memory as well: it makes the session work even if the write never lands, and
    // the vault is only ever a cache of what the server will be told about anyway.
    memoryKeys = mergeKeyLists(memoryKeys, [record]);

    const db = await openStore();
    if (db) {
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
                storePromise = null;
                finish(error);
            }
        });
    }

    clearDecryptCache();
}

export function getDeviceId() {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
        memoryDeviceId = stored;
        return stored;
    }
    const id = memoryDeviceId ?? crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    memoryDeviceId = id;
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
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
        "deriveKey",
        "deriveBits",
    ]);
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const raw = await crypto.subtle.exportKey("raw", pair.publicKey);
    return importDeviceKey(deviceId, pkcs8, toBase64(new Uint8Array(raw)));
}

/**
 * Makes a device key that *can* be backed up, for the recovery setup path.
 *
 * WebCrypto will not wrap a non-extractable key, so a key destined for the backup blob has to exist in
 * exportable form at the moment of export. Both key paths (`createAndStoreKey` and this one) generate
 * extractable, export the PKCS#8 once, and keep a fresh import of those same bytes with
 * `extractable: false` for daily use; the record persists the bytes as `pkcs8B64` so a later re-setup
 * can wrap them again (see the IndexedDB trade-off in AGENTS.md).
 *
 * If this device already has such a record it is reused instead of rotating: the backup must contain the
 * key messages are already wrapped to, or everything sent before setup would be unreadable after a
 * restore on a new device.
 */
export async function createRecoverableDeviceKey(deviceId) {
    const stored = await loadStoredKeys();
    const existing = [...stored]
        .reverse()
        .find((entry) => entry.deviceId === deviceId && entry.pkcs8B64);
    if (existing) {
        return { record: existing, pkcs8: fromBase64(existing.pkcs8B64) };
    }

    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
        "deriveKey",
        "deriveBits",
    ]);

    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const raw = await crypto.subtle.exportKey("raw", pair.publicKey);

    const record = await importDeviceKey(deviceId, pkcs8, toBase64(new Uint8Array(raw)));

    return { record, pkcs8 };
}

/**
 * Imports PKCS#8 private-key bytes as this browser's device key, storing it non-extractable. Used both
 * for the recovery-setup path (re-importing what was just made) and for restoring on a new device.
 */
export async function importDeviceKey(deviceId, pkcs8Bytes, publicKeyB64) {
    const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Bytes,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"],
    );

    const record = {
        localId: crypto.randomUUID(),
        deviceId,
        publicKeyB64,
        privateKey,
        pkcs8B64: toBase64(pkcs8Bytes),
        createdAt: Date.now(),
    };
    await saveStoredKey(record);
    return record;
}

export const DEVICE_KEY_CACHE_TTL_MS = 10 * 60 * 1000;
export const OWN_KEY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const deviceKeyDirectoryCache = new Map();
const deviceKeyInFlight = new Map();
const importedPeerKeyCache = new Map();
const recipientStatusCache = new Map();
let ensuredOwnKeyCache = null;

function normalizeUsernameKey(username) {
    return (username ?? "").trim().toLowerCase();
}

export function clearDeviceKeyCache(username) {
    if (username) {
        const key = normalizeUsernameKey(username);
        if (key) {
            deviceKeyDirectoryCache.delete(key);
            deviceKeyInFlight.delete(key);
            recipientStatusCache.delete(key);
            if (ensuredOwnKeyCache?.usernameKey === key) {
                ensuredOwnKeyCache = null;
            }
        }
        return;
    }
    deviceKeyDirectoryCache.clear();
    deviceKeyInFlight.clear();
    importedPeerKeyCache.clear();
    recipientStatusCache.clear();
    // Do not clear ensuredOwnKeyCache here; own key is persistent for the active session.
}

export function clearOwnDeviceKeyCache() {
    ensuredOwnKeyCache = null;
}

async function fetchDeviceKeys(username, options) {
    const trimmed = username?.trim();
    if (!trimmed) return [];

    const cacheKey = normalizeUsernameKey(trimmed);
    const now = Date.now();

    if (!options?.forceRefresh) {
        const cached = deviceKeyDirectoryCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.keys;
        }
    }

    const inFlight = deviceKeyInFlight.get(cacheKey);
    if (inFlight && !options?.forceRefresh) {
        return inFlight;
    }

    const promise = (async () => {
        try {
            const response = await apiClient.get(`/keys/${encodeURIComponent(trimmed)}`);
            const keys = response.data?.data ?? [];
            if (keys.length > 0) {
                deviceKeyDirectoryCache.set(cacheKey, {
                    keys,
                    expiresAt: Date.now() + DEVICE_KEY_CACHE_TTL_MS,
                });
                recipientStatusCache.set(cacheKey, {
                    hasKeys: true,
                    expiresAt: Date.now() + DEVICE_KEY_CACHE_TTL_MS,
                });
            } else {
                // Do not cache empty key list in deviceKeyDirectoryCache so new keys upgrade immediately.
                deviceKeyDirectoryCache.delete(cacheKey);
                // Keep recipient status for 30s for UI fallback indicators.
                recipientStatusCache.set(cacheKey, {
                    hasKeys: false,
                    expiresAt: Date.now() + 30 * 1000,
                });
            }
            return keys;
        } catch (error) {
            // 403 (the policy refuses this sender) or 404: treat as "no keys", which sends plaintext —
            // the message itself would be refused anyway, so nothing leaks that a send could succeed.
            if (error.response) return [];
            throw error;
        }
    })().finally(() => {
        if (deviceKeyInFlight.get(cacheKey) === promise) {
            deviceKeyInFlight.delete(cacheKey);
        }
    });

    deviceKeyInFlight.set(cacheKey, promise);
    return promise;
}

export function hasCachedRecipientDeviceKeys(username) {
    const trimmed = username?.trim();
    if (!trimmed) return null;
    const cacheKey = normalizeUsernameKey(trimmed);
    const cachedDir = deviceKeyDirectoryCache.get(cacheKey);
    if (cachedDir && cachedDir.expiresAt > Date.now() && cachedDir.keys.length > 0) {
        return true;
    }
    const cachedStatus = recipientStatusCache.get(cacheKey);
    if (cachedStatus && cachedStatus.expiresAt > Date.now()) {
        return cachedStatus.hasKeys;
    }
    return null;
}

export async function publishKey(deviceId, publicKey) {
    clearDeviceKeyCache();
    await apiClient.post("/keys", { deviceId, publicKey });
    clearDeviceKeyCache();
}

/**
 * Pre-warms the recipient's published device keys (and this device's own key state) when opening a
 * conversation thread so the first and subsequent message sends execute with zero `/api/keys` RTTs.
 * Returns true if recipient has keys, false if recipient has 0 keys (fallback), or null if indeterminate.
 */
export async function prefetchRecipientDeviceKeys(recipientUsername) {
    const trimmed = recipientUsername?.trim();
    if (!trimmed) {
        ensureDeviceKey().catch(() => undefined);
        return null;
    }
    const cacheKey = normalizeUsernameKey(trimmed);
    const cached = deviceKeyDirectoryCache.get(cacheKey);
    let hasKeys;
    if (cached && cached.expiresAt > Date.now() && cached.keys.length > 0) {
        hasKeys = true;
    } else {
        const keys = await fetchDeviceKeys(trimmed).catch(() => []);
        hasKeys = keys.length > 0;
    }
    ensureDeviceKey().catch(() => undefined);
    return hasKeys;
}

// How old a device's `lastSeenAt` may get before this device re-publishes to refresh it. Far
// inside the server's 30-day pruning window, so a device that opens the app at all stays listed.
const LIVENESS_REFRESH_MS = 24 * 60 * 60 * 1000;

function isLivenessStale(key) {
    const seenAt = Date.parse(key.lastSeenAt ?? key.createdAt ?? "");
    return !Number.isFinite(seenAt) || Date.now() - seenAt > LIVENESS_REFRESH_MS;
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
    const username = currentUsername();
    const usernameKey = normalizeUsernameKey(username);
    if (
        usernameKey &&
        ensuredOwnKeyCache &&
        ensuredOwnKeyCache.expiresAt > Date.now() &&
        ensuredOwnKeyCache.usernameKey === usernameKey &&
        (!memoryDeviceId || memoryDeviceId === ensuredOwnKeyCache.deviceId) &&
        memoryKeys?.some((entry) => entry.publicKeyB64 === ensuredOwnKeyCache.result.record.publicKeyB64)
    ) {
        return Promise.resolve(ensuredOwnKeyCache.result);
    }

    if (!ensurePromise) {
        ensurePromise = runEnsureDeviceKey().finally(() => {
            ensurePromise = null;
        });
    }
    return ensurePromise;
}

function cacheEnsuredOwnKey(username, deviceId, result) {
    const usernameKey = normalizeUsernameKey(username);
    const expiresAt = Date.now() + OWN_KEY_CACHE_TTL_MS;
    ensuredOwnKeyCache = {
        usernameKey,
        deviceId,
        result,
        expiresAt,
    };
    if (result.published.length > 0) {
        deviceKeyDirectoryCache.set(usernameKey, {
            keys: result.published.map((k) => ({
                deviceId: k.deviceId,
                publicKey: k.publicKey ?? k.publicKeyB64,
                createdAt: k.createdAt,
                lastSeenAt: k.lastSeenAt,
            })),
            expiresAt: Date.now() + OWN_KEY_CACHE_TTL_MS,
        });
    }
    return result;
}

async function runEnsureDeviceKey() {
    const username = currentUsername();
    if (!username) throw new Error("Not signed in");

    const usernameKey = normalizeUsernameKey(username);
    const deviceId = getDeviceId();
    const stored = await loadStoredKeys();

    if (
        ensuredOwnKeyCache &&
        ensuredOwnKeyCache.expiresAt > Date.now() &&
        ensuredOwnKeyCache.usernameKey === usernameKey &&
        ensuredOwnKeyCache.deviceId === deviceId &&
        stored.some((entry) => entry.publicKeyB64 === ensuredOwnKeyCache.result.record.publicKeyB64)
    ) {
        return ensuredOwnKeyCache.result;
    }

    const published = await fetchDeviceKeys(username);
    const mine = published.find((key) => key.deviceId === deviceId);

    if (mine) {
        const record = stored.find((entry) => entry.publicKeyB64 === mine.publicKey);
        if (record) {
            // The server prunes a device key that has not been published for 30 days, and a device
            // that already has its key in the directory would otherwise never publish again — so a
            // phone used every day would still be pruned a month after it first signed in. Re-publish
            // once the stamp is a day old: one cheap upsert a day keeps an active device alive.
            if (isLivenessStale(mine)) {
                apiClient.post("/keys", { deviceId, publicKey: record.publicKeyB64 }).catch(() => undefined);
            }
            return cacheEnsuredOwnKey(username, deviceId, { record, published });
        }

        // The public key is on the server but its private half is gone (storage cleared since): rotate
        // by publishing a fresh key here. Old messages wrapped to the lost key stay unreadable; new
        // ones wrap to this one.
        const fresh = await createAndStoreKey(deviceId);
        await publishKey(deviceId, fresh.publicKeyB64);
        return cacheEnsuredOwnKey(username, deviceId, {
            record: fresh,
            published: [
                ...published.filter((key) => key.deviceId !== deviceId),
                { deviceId, publicKey: fresh.publicKeyB64 },
            ],
        });
    }

    // Nothing published for this device yet. Prefer a key this device already generated (an upload that
    // failed, or another tab that generated while this call was in flight) over making yet another: the
    // private halves share one store, so adopting one is always at least as good as generating.
    const ours = stored
        .filter((entry) => entry.deviceId === deviceId)
        .sort((a, b) => b.createdAt - a.createdAt);

    if (ours.length > 0) {
        await publishKey(deviceId, ours[0].publicKeyB64);
        return cacheEnsuredOwnKey(username, deviceId, {
            record: ours[0],
            published: [...published, { deviceId, publicKey: ours[0].publicKeyB64 }],
        });
    }

    const fresh = await createAndStoreKey(deviceId);

    // Another tab may have published between our fetch and now; last write wins on the server and the
    // loser's private half is still in the store, so either key opens the messages.
    await publishKey(deviceId, fresh.publicKeyB64);
    return cacheEnsuredOwnKey(username, deviceId, {
        record: fresh,
        published: [...published, { deviceId, publicKey: fresh.publicKeyB64 }],
    });
}

/* ------------------------------------------------------------------ crypto primitives */

async function importPeerKey(publicKeyB64) {
    let cached = importedPeerKeyCache.get(publicKeyB64);
    if (!cached) {
        cached = crypto.subtle
            .importKey(
                "raw",
                fromBase64(publicKeyB64),
                { name: "ECDH", namedCurve: "P-256" },
                false,
                [],
            )
            .catch((err) => {
                importedPeerKeyCache.delete(publicKeyB64);
                throw err;
            });
        importedPeerKeyCache.set(publicKeyB64, cached);
    }
    return cached;
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
 * Picks the devices a message is wrapped for: the sender's own devices first — the current one ahead
 * of the rest, because it must be able to read its own message after a reload — and then the
 * recipient's, most recently seen first. The order is not a hint about recency alone: it is what
 * decides which wrap the recipient's fast path finds first.
 */
export function selectWrapTargets(ownKeys, recipientKeys, currentDeviceId) {
    const seenAt = (key) => {
        const parsed = Date.parse(key.lastSeenAt ?? key.createdAt ?? "");
        return Number.isFinite(parsed) ? parsed : Date.now();
    };
    const byRecency = (a, b) => seenAt(b) - seenAt(a);

    const own = [...ownKeys].sort(byRecency);
    const ownSelected = [
        ...own.filter((key) => key.deviceId === currentDeviceId),
        ...own.filter((key) => key.deviceId !== currentDeviceId),
    ].slice(0, MAX_OWN_WRAPS);

    const recipient = [...recipientKeys]
        .sort(byRecency)
        .slice(0, MAX_WRAPS - ownSelected.length);

    return [...ownSelected, ...recipient];
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

    const ownKeyPromise = ensureDeviceKey().then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
    );
    const recipientKeys = await fetchDeviceKeys(recipientUsername);
    if (recipientKeys.length === 0) return plaintext;

    const ownOutcome = await ownKeyPromise;
    if (!ownOutcome.ok) {
        throw ownOutcome.error;
    }
    const { published: ownKeys } = ownOutcome.value;

    // Dedupe: a user messaging themselves (or the same key listed twice) must not get two wraps.
    const targets = new Map();
    for (const key of selectWrapTargets(ownKeys, recipientKeys, getDeviceId())) {
        targets.set(`${key.deviceId}|${key.publicKey}`, key);
    }

    const contentKey = randomBytes(32);
    const iv = randomBytes(12);

    // One ephemeral keypair per message: the wrap keys are all derived from it, so learning one
    // message's wrap key never opens another message.
    const ephemeral = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"],
    );
    const ephemeralB64 = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey)));
    const payloadAad = utf8(`circlehub:v1:${ephemeralB64}`);

    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, additionalData: payloadAad },
            await importAesKey(contentKey),
            padPlaintext(plaintext),
        ),
    );

    const wraps = [];
    for (const target of targets.values()) {
        const wrapKey = await deriveWrapKey(ephemeral.privateKey, await importPeerKey(target.publicKey));
        const wrapIv = randomBytes(12);
        const wrapAad = utf8(`${target.deviceId}:${ephemeralB64}`);
        const wrapped = new Uint8Array(
            await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv, additionalData: wrapAad }, wrapKey, contentKey),
        );
        wraps.push({ d: target.deviceId, k: toBase64(concat(wrapIv, wrapped)) });
    }

    const envelope = JSON.stringify({
        v: 1,
        p: 1,
        alg: "ECDH-P256+HKDF-SHA256+AES-256-GCM",
        e: ephemeralB64,
        iv: toBase64(iv),
        ct: toBase64(ciphertext),
        w: wraps,
    });

    const serialized = ENC_PREFIX + toBase64(utf8(envelope));
    decryptCache.set(serialized, Promise.resolve(plaintext));
    settledCache.set(serialized, plaintext);
    if (decryptCache.size > DECRYPT_CACHE_LIMIT) {
        const oldest = decryptCache.keys().next().value;
        decryptCache.delete(oldest);
        settledCache.delete(oldest);
    }
    return serialized;
}

/* ------------------------------------------------------------------ receive path */

/**
 * Opens one wrap with a derived wrap key. Returns the plaintext, or null when the pair does not
 * authenticate. The AEAD tag is the only thing that proves a key is the right one, so a failure
 * here is a "keep trying", never a hard error.
 */
async function openWrap(wrapKey, wrap, contentIv, ciphertext, ephemeralB64, isPhase1) {
    try {
        const packed = fromBase64(wrap.k);
        let contentKey;
        let plaintext;

        if (isPhase1 && ephemeralB64) {
            const wrapAad = utf8(`${wrap.d}:${ephemeralB64}`);
            const payloadAad = utf8(`circlehub:v1:${ephemeralB64}`);
            contentKey = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: packed.slice(0, 12), additionalData: wrapAad },
                wrapKey,
                packed.slice(12),
            );
            plaintext = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: contentIv, additionalData: payloadAad },
                await importAesKey(new Uint8Array(contentKey)),
                ciphertext,
            );
            return unpadPlaintext(new Uint8Array(plaintext));
        } else {
            contentKey = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: packed.slice(0, 12) },
                wrapKey,
                packed.slice(12),
            );
            plaintext = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: contentIv },
                await importAesKey(new Uint8Array(contentKey)),
                ciphertext,
            );
            return new TextDecoder().decode(plaintext);
        }
    } catch {
        return null;
    }
}

function prioritizeKeysForDevice(keys, currentDeviceId) {
    if (keys.length <= 1) return keys;
    return [...keys].sort((a, b) => {
        const aCurrent = a.deviceId === currentDeviceId ? 1 : 0;
        const bCurrent = b.deviceId === currentDeviceId ? 1 : 0;
        if (aCurrent !== bCurrent) return bCurrent - aCurrent;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
}

async function tryDecryptWithKeys(envelope, rawKeys, ephemeralPublicKey, contentIv, ciphertext) {
    const isPhase1 = envelope?.p === 1;
    const ephemeralB64 = envelope?.e;
    const keys = prioritizeKeysForDevice(rawKeys, getDeviceId());

    // The wrap key depends only on our private key and the sender's ephemeral public key — never on
    // which wrap is being opened — so it is derived once per local key and reused for every wrap.
    // Deriving it per (key, wrap) pair made the fallback sweep quadratic: a seven-wrap envelope
    // against a three-key ring paid twenty-one ECDHs where three were needed.
    const wrapKeys = new Map();
    function wrapKeyFor(index) {
        let pending = wrapKeys.get(index);
        if (!pending) {
            pending = deriveWrapKey(keys[index].privateKey, ephemeralPublicKey);
            wrapKeys.set(index, pending);
        }
        return pending;
    }

    // Fast path: every wrap names the device it belongs to (`w[].d`), so try the wraps whose device
    // id this browser actually holds a key for before the sweep below. The sweep costs one ECDH per
    // local key, and the key directory grows with every reinstall a device makes — the mobile
    // client pays that price in pure JavaScript, where it is a visible freeze.
    const byDeviceId = new Map();
    for (let index = 0; index < keys.length; index += 1) {
        const bucket = byDeviceId.get(keys[index].deviceId);
        if (bucket) {
            bucket.push(index);
        } else {
            byDeviceId.set(keys[index].deviceId, [index]);
        }
    }

    for (const wrap of envelope.w) {
        const bucket = byDeviceId.get(wrap.d);
        if (!bucket) continue;

        for (const index of bucket) {
            const plaintext = await openWrap(
                await wrapKeyFor(index),
                wrap,
                contentIv,
                ciphertext,
                ephemeralB64,
                isPhase1,
            );
            if (plaintext !== null) return plaintext;
        }
    }

    // Fallback: the device id is a hint, not a proof. A key restored from the recovery phrase lives
    // under the *current* device id while the message was wrapped for the id the old profile used,
    // and a device that rotated its key keeps its id with a different key — neither is reachable by
    // the id alone, so the sweep still runs and the tag stays the only real check.
    for (let index = 0; index < keys.length; index += 1) {
        const wrapKey = await wrapKeyFor(index);
        for (const wrap of envelope.w) {
            const plaintext = await openWrap(
                wrapKey,
                wrap,
                contentIv,
                ciphertext,
                ephemeralB64,
                isPhase1,
            );
            if (plaintext !== null) return plaintext;
        }
    }

    return null;
}

async function decryptEnvelope(envelope) {
    if (!envelope || envelope.v !== 1 || !envelope.e || !Array.isArray(envelope.w)) {
        return UNREADABLE;
    }

    const hadCachedDbKeys = keysLoadedFromDb;
    const [ephemeralPublicKey, keys] = await Promise.all([
        importPeerKey(envelope.e),
        loadStoredKeys(),
    ]);
    const contentIv = fromBase64(envelope.iv);
    const ciphertext = fromBase64(envelope.ct);

    const firstAttempt = await tryDecryptWithKeys(
        envelope,
        keys,
        ephemeralPublicKey,
        contentIv,
        ciphertext
    );
    if (firstAttempt !== null) return firstAttempt;

    // If keys came from the in-memory cache and could not open the envelope, another window of the
    // same browser may have written a fresh key to IndexedDB without triggering visibilitychange.
    if (hadCachedDbKeys) {
        keysLoadedFromDb = false;
        const refreshedKeys = await loadStoredKeys();
        if (refreshedKeys.length > keys.length) {
            const knownIds = new Set(keys.map((k) => k.localId));
            const newKeys = refreshedKeys.filter((k) => !knownIds.has(k.localId));
            const retryAttempt = await tryDecryptWithKeys(
                envelope,
                newKeys,
                ephemeralPublicKey,
                contentIv,
                ciphertext
            );
            if (retryAttempt !== null) return retryAttempt;
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
        if (text === UNREADABLE) {
            decryptCache.delete(content);
            return text;
        }
        settledCache.set(content, text);
        if (decryptCache.size > DECRYPT_CACHE_LIMIT) {
            const oldest = decryptCache.keys().next().value;
            decryptCache.delete(oldest);
            settledCache.delete(oldest);
        }
        scheduleNotifyDecryptCacheChanged();
        return text;
    });

    decryptCache.set(content, promise);
    return promise;
}

/** Settled plaintext for a ciphertext, or null while it is still (or never) decrypted. */
export function peekDecrypted(content) {
    return settledCache.get(content) ?? null;
}

export function clearDecryptCache() {
    decryptCache.clear();
    settledCache.clear();
    clearDeviceKeyCache();
    notifyDecryptCacheChanged();
}
