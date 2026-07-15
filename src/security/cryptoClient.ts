import * as Crypto from 'expo-crypto';

/**
 * Narrow interface over `expo-crypto` — same testability-by-narrowing pattern as
 * `secureStoreClient.ts`/`biometricClient.ts` (its digest/random functions are no-ops under Jest,
 * returning an empty string / all-zero bytes — see `apps/mobile/CLAUDE.md`).
 */
export interface CryptoClient {
  digestSha256Hex(value: string): Promise<string>;
  /** A random hex string `byteCount * 2` characters long. */
  randomHex(byteCount: number): Promise<string>;
}

export const cryptoClient: CryptoClient = {
  digestSha256Hex(value) {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  },
  async randomHex(byteCount) {
    const bytes = await Crypto.getRandomBytesAsync(byteCount);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  },
};
