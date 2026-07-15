import { cryptoClient } from './cryptoClient';

/**
 * The PIN app-lock (US-028, `docs/specs/securite-sauvegarde.md`) is a **local access gate**, not
 * disk encryption — it does not encrypt the SQLite database, so a forgotten PIN never makes data
 * unrecoverable (unlike a lost cloud-backup recovery key, which the spec explicitly says has no
 * backdoor). The PIN itself is still salted+hashed rather than stored in the clear, purely so a
 * shoulder-surfed secure-store dump doesn't reveal it directly.
 */
export async function generateSalt(): Promise<string> {
  return cryptoClient.randomHex(16);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return cryptoClient.digestSha256Hex(`${salt}:${pin}`);
}
