import type { SqlDatabase } from '../db/types';
import { BackupNotEnabledError, WrongRecoveryKeyError } from './backupErrors';
import { backupFileClient } from './backupFileClient';
import { buildBackupPayload } from './backupPayload';
import { deriveBackupKey, encryptWithKey } from './backupCrypto';
import { getBackupSettings, recordBackupSuccess, verifyRecoveryKey } from './backupSettings';
import type { BackupSettings } from './backupSettings';

export { BackupNotEnabledError, WrongRecoveryKeyError } from './backupErrors';

export interface ExportResult {
  uri: string;
  settings: BackupSettings;
}

/**
 * US-071a: builds the backup payload, encrypts it end-to-end with a key derived from the
 * household's recovery passphrase (re-typed here, never stored — US-071a's 2nd criterion) *before*
 * anything is written to disk, then writes the ciphertext locally and hands it to the OS share
 * sheet so the household can save/send it wherever they choose (manual export, no remote store of
 * our own — see `progress.md` for why).
 */
export async function exportBackup(db: SqlDatabase, recoveryKey: string): Promise<ExportResult> {
  const settings = await getBackupSettings();
  if (!settings.enabled || !settings.recoveryKeySalt) {
    throw new BackupNotEnabledError();
  }
  const validKey = await verifyRecoveryKey(recoveryKey, settings);
  if (!validKey) {
    throw new WrongRecoveryKeyError();
  }

  const payload = await buildBackupPayload(db);
  const aesKey = deriveBackupKey(recoveryKey, settings.recoveryKeySalt);
  const ciphertext = encryptWithKey(JSON.stringify(payload), aesKey);
  const file = JSON.stringify({ version: 1, salt: settings.recoveryKeySalt, ciphertext });

  const uri = await backupFileClient.writeLocalBackup(file);
  await backupFileClient.share(uri);
  const updatedSettings = await recordBackupSuccess();

  return { uri, settings: updatedSettings };
}
