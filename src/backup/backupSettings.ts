import { cryptoClient } from '../security/cryptoClient';
import { secureStoreClient } from '../security/secureStoreClient';

/**
 * Encrypted-backup preferences (US-071a/US-071b) — same "verify a hash, never store the secret
 * itself" shape as `appLockSettings.ts`'s PIN, and the same storage (`secureStoreClient`, the OS
 * keychain/keystore): `recoveryKeySalt` is public (needed to re-derive the AES key from the
 * passphrase on any device) but `recoveryKeyHash` only lets the app *verify* a re-typed passphrase
 * is correct before attempting to decrypt — the raw passphrase itself is never persisted anywhere,
 * on this device or in the exported file. There is deliberately no recovery path for a lost
 * passphrase: unlike the app-lock PIN (a local access gate a factory reset trivially bypasses),
 * this key is real encryption, and a backdoor would defeat the point of encrypting at all.
 */
export interface BackupSettings {
  enabled: boolean;
  recoveryKeySalt: string | null;
  recoveryKeyHash: string | null;
  /** ISO 8601 UTC of the last successful export — `null` until one has ever completed. */
  lastBackupAt: string | null;
}

const STORAGE_KEY = 'mizaniyati.backupSettings';

const DEFAULTS: BackupSettings = {
  enabled: false,
  recoveryKeySalt: null,
  recoveryKeyHash: null,
  lastBackupAt: null,
};

export async function getBackupSettings(): Promise<BackupSettings> {
  const raw = await secureStoreClient.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULTS;
  }
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await secureStoreClient.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** US-071a's 1st criterion: backups start disabled, and turning them on requires this explicit
 *  call with a household-chosen recovery passphrase. */
export async function enableBackup(recoveryKey: string): Promise<BackupSettings> {
  const recoveryKeySalt = await cryptoClient.randomHex(16);
  const recoveryKeyHash = await cryptoClient.digestSha256Hex(`${recoveryKeySalt}:${recoveryKey}`);
  const settings: BackupSettings = {
    enabled: true,
    recoveryKeySalt,
    recoveryKeyHash,
    lastBackupAt: null,
  };
  await saveBackupSettings(settings);
  return settings;
}

/** US-071a's 3rd criterion ("la désactivation supprime les sauvegardes"): forgets the recovery
 *  key and the last-backup date. Deleting any backup file still sitting in the app's own sandbox
 *  is the caller's job (`backupFileClient.deleteLocalBackup`) — this only clears the credential. */
export async function disableBackup(): Promise<BackupSettings> {
  await saveBackupSettings(DEFAULTS);
  return DEFAULTS;
}

export async function verifyRecoveryKey(
  recoveryKey: string,
  settings: BackupSettings,
): Promise<boolean> {
  if (!settings.recoveryKeySalt || !settings.recoveryKeyHash) {
    return false;
  }
  const candidateHash = await cryptoClient.digestSha256Hex(
    `${settings.recoveryKeySalt}:${recoveryKey}`,
  );
  return candidateHash === settings.recoveryKeyHash;
}

/** US-071b's 2nd criterion: the settings screen reads this back to show "last successful backup". */
export async function recordBackupSuccess(): Promise<BackupSettings> {
  const current = await getBackupSettings();
  const settings: BackupSettings = { ...current, lastBackupAt: new Date().toISOString() };
  await saveBackupSettings(settings);
  return settings;
}
