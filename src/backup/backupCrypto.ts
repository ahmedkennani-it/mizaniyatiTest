import CryptoJS from 'crypto-js';

// 10k rounds of PBKDF2-SHA256 in pure JS (no native crypto acceleration available here) already
// takes a few hundred ms on a modern device — enough to meaningfully slow down brute-forcing a
// short passphrase while staying comfortable for an explicit, occasional "export backup" tap.
const PBKDF2_ITERATIONS = 10_000;
const KEY_SIZE_WORDS = 256 / 32;

/**
 * Derives a 256-bit AES key from the household's recovery passphrase and a (public, non-secret)
 * salt via PBKDF2-SHA256 (US-071a's "clé dérivée côté client" criterion) — the passphrase itself
 * is never stored anywhere, only used in memory for this derivation. Deterministic: the same
 * passphrase + salt always yields the same key, which is exactly what lets a restore on a blank
 * device (US-071b) re-derive it from the salt embedded in the backup file plus the passphrase the
 * household re-types.
 */
export function deriveBackupKey(passphrase: string, saltHex: string): string {
  return CryptoJS.PBKDF2(passphrase, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  }).toString(CryptoJS.enc.Hex);
}

/**
 * AES-256-CBC with a fresh random IV per call (so re-exporting the same data never produces the
 * same ciphertext twice) — `iv:ciphertext`, both hex, is the on-disk wire format `decryptWithKey`
 * expects back.
 */
export function encryptWithKey(plaintext: string, keyHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.ciphertext.toString(CryptoJS.enc.Hex)}`;
}

/** Inverse of `encryptWithKey`. Throws (via a garbled/empty result) on the wrong key — callers
 *  verify the recovery key's hash first (`verifyRecoveryKey`) so a wrong key reads as a friendly
 *  error rather than a stack trace. */
export function decryptWithKey(payload: string, keyHex: string): string {
  const [ivHex, ciphertextHex] = payload.split(':');
  if (!ivHex || !ciphertextHex) {
    throw new Error('Malformed backup payload: expected "iv:ciphertext".');
  }
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(ciphertextHex),
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  try {
    // The wrong key almost always produces bytes that aren't valid UTF-8/PKCS7 padding, which
    // crypto-js reports by throwing here rather than returning a decodable (if garbled) string —
    // normalized to the same "this key doesn't work" outcome either way.
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('Decryption failed: wrong key or corrupted payload.');
  }
}
