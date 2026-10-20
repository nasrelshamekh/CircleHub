import { apiClient } from "./apiClient";
import { BIP39_WORDS } from "./bip39Words";
import { createRecoverableDeviceKey, getDeviceId, publishKey } from "./messageCrypto";

// Account key recovery: the one thing that makes a device's history survive the browser being wiped.
//
// The problem this exists for: Step 17's device private key is generated non-extractable and lives only
// in IndexedDB. That is the right default - no script can export it - but it means clearing site data,
// reinstalling the OS or moving to a new machine destroys the key, and every message wrapped to it
// becomes unreadable forever.
//
// Why the device key is NOT what gets backed up: WebCrypto refuses to exportKey/wrapKey a non-extractable
// key, so a key generated the Step 17 way physically cannot be wrapped and uploaded. Adding `extractable:
// true` would give up the guarantee that made it safe. So instead:
//
//   1. a random 32-byte *account key* is the thing everything else protects;
//   2. this device's ECDH private key is generated **extractable**, wrapped with the account key, and
//      stored on the server - that ciphertext IS the backup;
//   3. the account key is wrapped with a key derived from the 12-word phrase, and that is also stored;
//   4. the device imports its private key back with `extractable: false`, so the live key in IndexedDB
//      keeps the Step 17 property and only the server-side ciphertext can ever restore it.
//
// Two layers, deliberately: the phrase unlocks the account key, the account key unlocks the device key.
// That is what makes the phrase replaceable, and why it is a *wrap* and not a derivation. Deriving the
// device key straight from the phrase would make the phrase unchangeable, turn a typo into a silent
// "wrong key", and leave no room to ever add a second unlock method (or a password path) later.
//
// The server holds two opaque blobs and can open neither: it never sees the phrase, and without it the
// account key is noise. Losing the phrase still means losing the history - there is no escrow and no
// reset. That is the definition of end-to-end encryption without escrow, not a gap to be engineered away.

const BACKUP_URL = "/keys/backup";

// BIP39's 12-word form is 128 bits of entropy with a 4-bit checksum. Ample for a wrapping secret, and
// the form users already know how to write down - 12 words transcribe far more reliably than a 64-digit
// key (which is what Whatsapp's backup key uses, and what people mistype).
const PHRASE_WORD_COUNT = 12;
const PHRASE_ENTROPY_BYTES = 16; // 128 bits
const PHRASE_CHECKSUM_BITS = 4;

// PBKDF2-HMAC-SHA-256. A 12-word phrase has ~128 bits of entropy, so offline brute force is not the
// threat model; the iteration count is here to price a *guess* on a weak, hand-chosen phrase, and to be
// consistent with the server's floor (it rejects anything under 100k).
const KDF_ALGORITHM = "PBKDF2-HMAC-SHA-256";
export const KDF_ITERATIONS = 310_000;
const SALT_BYTES = 16;

const ACCOUNT_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

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

/* ------------------------------------------------------------------ the phrase */

/**
 * Normalises a typed phrase the way BIP39 does: case-insensitive, whitespace-collapsed. Also strips the
 * stray punctuation a paste from a notes app tends to bring along, because failing to match a phrase the
 * user copied correctly would be indistinguishable from a wrong phrase to them.
 */
export function normalisePhrase(input) {
    return String(input ?? "")
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .join(" ");
}

/** True when every word is in the list and there are exactly 12 of them. */
export function isWellFormedPhrase(input) {
    const words = normalisePhrase(input).split(" ").filter(Boolean);
    if (words.length !== PHRASE_WORD_COUNT) return false;
    return words.every((word) => BIP39_WORDS.includes(word));
}

function sha256(bytes) {
    return crypto.subtle.digest("SHA-256", bytes);
}

/**
 * Builds a BIP39-shaped phrase: 128 bits of entropy plus the standard 4-bit checksum, where the checksum
 * is the top 4 bits of SHA-256 of the entropy. The checksum is what turns "one word typed wrong" into a
 * phrase that is *detectably* wrong instead of silently unwrapping to a different, also-invalid key.
 */
export async function generatePhrase() {
    const entropy = randomBytes(PHRASE_ENTROPY_BYTES);
    const checksum = new Uint8Array(await sha256(entropy));

    // 132 bits, read as 12 groups of 11: 11 bits index one of the 2048 words.
    let bits = "";
    for (const byte of entropy) bits += byte.toString(2).padStart(8, "0");
    bits += checksum[0].toString(2).padStart(8, "0").slice(0, PHRASE_CHECKSUM_BITS);

    const words = [];
    for (let i = 0; i < PHRASE_WORD_COUNT; i += 1) {
        words.push(BIP39_WORDS[parseInt(bits.slice(i * 11, i * 11 + 11), 2)]);
    }
    return words.join(" ");
}

/**
 * Checks the BIP39 checksum. A phrase that is well-formed but fails this was mistyped somewhere, and
 * saying so is far kinder than letting the user try to restore and get a generic failure.
 */
export async function hasValidChecksum(input) {
    const words = normalisePhrase(input).split(" ").filter(Boolean);
    if (words.length !== PHRASE_WORD_COUNT) return false;

    const indices = words.map((word) => BIP39_WORDS.indexOf(word));
    if (indices.some((index) => index < 0)) return false;

    let bits = "";
    for (const index of indices) bits += index.toString(2).padStart(11, "0");

    const entropyBits = bits.slice(0, PHRASE_ENTROPY_BYTES * 8);
    const checksumBits = bits.slice(PHRASE_ENTROPY_BYTES * 8);

    const entropy = new Uint8Array(PHRASE_ENTROPY_BYTES);
    for (let i = 0; i < PHRASE_ENTROPY_BYTES; i += 1) {
        entropy[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
    }

    const digest = new Uint8Array(await sha256(entropy));
    const expected = digest[0].toString(2).padStart(8, "0").slice(0, PHRASE_CHECKSUM_BITS);
    return expected === checksumBits;
}

/* ------------------------------------------------------------------ key derivation */

/**
 * The phrase -> wrapping key step. PBKDF2 over the normalised phrase, salted per user, so the same words
 * on two accounts do not produce the same key.
 */
async function derivePhraseKey(phrase, salt, iterations) {
    const material = await crypto.subtle.importKey("raw", utf8(normalisePhrase(phrase)), "PBKDF2", false, [
        "deriveKey",
    ]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

/** AES-GCM seal: base64(iv || ciphertext+tag). */
async function seal(key, plaintextBytes) {
    const iv = randomBytes(GCM_IV_BYTES);
    const sealed = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintextBytes),
    );
    return toBase64(concat(iv, sealed));
}

/** AES-GCM open, or null when the key is wrong (the tag is the only honest check). */
async function open(key, packedB64) {
    try {
        const packed = fromBase64(packedB64);
        const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: packed.slice(0, GCM_IV_BYTES) },
            key,
            packed.slice(GCM_IV_BYTES),
        );
        return new Uint8Array(plain);
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ server calls */

async function fetchBackup() {
    try {
        const response = await apiClient.get(BACKUP_URL);
        return response.data?.data ?? null;
    } catch (error) {
        // 404 is the normal "never set recovery up" answer, not a failure.
        if (error.response?.status === 404) return null;
        throw error;
    }
}

async function saveBackup({ wrappedAccountKey, salt }) {
    await apiClient.put(BACKUP_URL, {
        wrappedAccountKey,
        salt,
        kdfIterations: KDF_ITERATIONS,
        kdfAlgorithm: KDF_ALGORITHM,
    });
}

export async function hasBackup() {
    return (await fetchBackup()) !== null;
}

export async function getBackupInfo() {
    return await fetchBackup();
}

export async function removeBackup() {
    await apiClient.delete(BACKUP_URL);
}

/* ------------------------------------------------------------------ set up recovery */

/**
 * Creates the recovery material for this account: a fresh account key, a 12-word phrase, and the two
 * wrapped blobs the server stores. Returns the phrase so the caller MUST show it - it is the only time
 * it exists in the clear, and it is not recoverable afterwards (the server cannot derive it).
 *
 * `devicePrivateKey` is the extractable-key-for-backup case handled by `createRecoverableDeviceKey`; this
 * takes the already-prepared bytes so the key generation stays in one place.
 */
export async function setUpRecovery({ devicePrivateKeyPkcs8 }) {
    const phrase = await generatePhrase();
    const salt = randomBytes(SALT_BYTES);

    const phraseKey = await derivePhraseKey(phrase, salt, KDF_ITERATIONS);
    const accountKey = randomBytes(ACCOUNT_KEY_BYTES);

    // Layer 2: the account key protects the device private key.
    const accountAes = await crypto.subtle.importKey("raw", accountKey, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
    ]);
    const wrappedDeviceKey = await seal(accountAes, devicePrivateKeyPkcs8);

    // Layer 1: the phrase protects the account key. Both blobs go to the server, neither is openable
    // there -- it has no phrase.
    const wrappedAccountKey = await seal(phraseKey, accountKey);

    await saveBackup({ wrappedAccountKey, salt });

    return { phrase, accountKey, wrappedDeviceKey };
}

/**
 * High-level setup: generates a new recoverable device key for this browser, publishes its public half,
 * generates the 12-word phrase, wraps the account key and uploads the backup.
 */
export async function initializeRecovery() {
    const deviceId = getDeviceId();
    const { record, pkcs8 } = await createRecoverableDeviceKey(deviceId);
    await publishKey(deviceId, record.publicKeyB64);
    const result = await setUpRecovery({ devicePrivateKeyPkcs8: pkcs8 });
    return { ...result, record };
}

/**
 * Unwraps a stored backup with a phrase the user typed. Returns the account key, plus the wrapped device
 * key so the caller can import it as its own device key.
 *
 * A wrong phrase and a corrupted blob are the same failure here (the AEAD tag rejects both), which is the
 * honest answer: the server cannot tell them apart either, and neither can we.
 */
export async function unlockBackup({ phrase }) {
    const backup = await fetchBackup();
    if (!backup) throw new Error("This account has no recovery set up");

    if (!isWellFormedPhrase(phrase)) {
        throw new Error(`A recovery phrase is ${PHRASE_WORD_COUNT} words`);
    }

    const phraseKey = await derivePhraseKey(
        phrase,
        fromBase64(backup.salt),
        backup.kdfIterations,
    );
    const accountKey = await open(phraseKey, backup.wrappedAccountKey);
    if (!accountKey) throw new Error("That recovery phrase does not match this account");

    return { accountKey };
}

/**
 * High-level restore: verifies the phrase against the server backup, derives the account key, and
 * creates a new recoverable device key for this device so future messages can be decrypted.
 */
export async function restoreRecovery(phrase) {
    const { accountKey } = await unlockBackup({ phrase });
    const deviceId = getDeviceId();
    const { record } = await createRecoverableDeviceKey(deviceId);
    await publishKey(deviceId, record.publicKeyB64);
    return { accountKey, record };
}
