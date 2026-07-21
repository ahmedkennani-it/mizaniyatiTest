export { deriveBackupKey, encryptWithKey, decryptWithKey } from './backupCrypto';
export {
  getBackupSettings,
  enableBackup,
  disableBackup,
  verifyRecoveryKey,
  recordBackupSuccess,
} from './backupSettings';
export type { BackupSettings } from './backupSettings';
export { buildBackupPayload } from './backupPayload';
export type { BackupPayloadV1 } from './backupPayload';
export { backupFileClient } from './backupFileClient';
export type { BackupFileClient } from './backupFileClient';
export { exportBackup, BackupNotEnabledError, WrongRecoveryKeyError } from './exportBackup';
export type { ExportResult } from './exportBackup';
