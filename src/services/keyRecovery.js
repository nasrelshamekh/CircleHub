import { apiClient } from "./apiClient";
import { BIP39_WORDS } from "./bip39Words";
import {
    clearDecryptCache,
    createRecoverableDeviceKey,
    getDeviceId,
    importDeviceKey,
    publishKey,
} from "./messageCrypto";

// Account key recovery: the one thing that makes a device's history survive the browser being wiped.
//
// The problem this exists for: the device private key lives only in this browser profile. Clearing site
// data, reinstalling the OS or moving to a new machine destroys the key, and every message wrapped to it
// becomes unreadable forever - so the key bytes must be recoverable from somewhere the wiped profile can
// reach, gated by something the server never sees: the 12-word phrase.
//
// How the backup is built: WebCrypto will not exportKey/wrapKey a non-extractable key, so the key bytes
// have to exist in exportable form at the moment of backup. The key paths in `messageCrypto.js` generate
// extractable, export the PKCS#8 once, and keep an `extractable: false` import for daily use; the record
// also persists the bytes as `pkcs8B64` so a later re-setup can wrap them again without rotating the key
// (that is the same-origin trade-off documented in AGENTS.md). `setUpRecovery` converts those bytes to
// the 97-byte portable form (32B scalar d || 65B uncompressed pub) and seals them under the
// phrase-derived key - that sealed blob IS the backup the server stores. A backup created before that
// change instead contains a random 32-byte account key (the original design, when no device key could be
// exported at all); `restoreRecovery` still opens those, it just has no key material to restore and
// makes a fresh local device key instead.
//
// A wrap, deliberately, not a derivation: deriving the device key straight from the phrase would make
// the phrase unchangeable, turn a typo into a silent "wrong key", and leave no room to ever add a second
// unlock method (or a password path) later. The phrase is replaceable because the thing it unlocks is a
// stored blob, not a function of the phrase itself.
//
// The server holds an opaque blob and can open neither half: it never sees the phrase, and without it the
// sealed key material is noise. Losing the phrase still means losing the history - there is no escrow and
// no reset. That is the definition of end-to-end encryption without escrow, not a gap to be engineered away.

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
export const KDF_ITERATIONS = 100_000;
const SALT_BYTES = 16;

const ACCOUNT_KEY_BYTES = 32;
const PUBLIC_KEY_BYTES = 65;
const PORTABLE_KEY_BYTES = ACCOUNT_KEY_BYTES + PUBLIC_KEY_BYTES; // 97 bytes: 32B scalar d || 65B uncompressed pub
const GCM_IV_BYTES = 12;

// Fixed ASN.1 DER framing for a WebCrypto P-256 PKCS#8 private key (138 bytes total):
//   [0..36]   PKCS8_HEADER (36 bytes)
//   [36..68]  32-byte P-256 private scalar d
//   [68..73]  PKCS8_MID (5 bytes)
//   [73..138] 65-byte uncompressed P-256 public point (0x04 || X || Y)
const PKCS8_HEADER = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
]);
const PKCS8_MID = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);

function pkcs8ToPortableKey(pkcs8Bytes) {
    const secretKey = pkcs8Bytes.slice(36, 68);
    const publicKey = pkcs8Bytes.slice(73, 138);
    return concat(secretKey, publicKey);
}

function portableKeyToPkcs8(portableBytes) {
    const secretKey = portableBytes.slice(0, 32);
    const publicKey = portableBytes.slice(32, 97);
    const out = new Uint8Array(138);
    out.set(PKCS8_HEADER, 0);
    out.set(secretKey, 36);
    out.set(PKCS8_MID, 68);
    out.set(publicKey, 73);
    return { pkcs8: out, publicKeyB64: toBase64(publicKey) };
}

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
    const saltB64 = typeof salt === "string" ? salt : toBase64(salt);
    await apiClient.put(BACKUP_URL, {
        wrappedAccountKey,
        salt: saltB64,
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
    const portableKey =
        devicePrivateKeyPkcs8?.length === 138
            ? pkcs8ToPortableKey(devicePrivateKeyPkcs8)
            : randomBytes(ACCOUNT_KEY_BYTES);

    // The phrase-derived AES-256-GCM key wraps the portable P-256 key material (97 bytes -> 168 base64 chars).
    const wrappedAccountKey = await seal(phraseKey, portableKey);

    await saveBackup({ wrappedAccountKey, salt: toBase64(salt) });
    clearDecryptCache();

    return { phrase, accountKey: portableKey, wrappedDeviceKey: wrappedAccountKey };
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
 * High-level restore: verifies the phrase against the server backup, unwraps the backed-up P-256 keypair,
 * imports it non-extractably into IndexedDB for this device, and publishes its public key so both past
 * and future messages can be decrypted.
 */
export async function restoreRecovery(phrase) {
    const { accountKey } = await unlockBackup({ phrase });
    const deviceId = getDeviceId();

    let record;
    if (accountKey.length === PORTABLE_KEY_BYTES) {
        const { pkcs8, publicKeyB64 } = portableKeyToPkcs8(accountKey);
        record = await importDeviceKey(deviceId, pkcs8, publicKeyB64);
    } else {
        const created = await createRecoverableDeviceKey(deviceId);
        record = created.record;
    }

    await publishKey(deviceId, record.publicKeyB64);
    clearDecryptCache();
    return { accountKey, record };
}
