/** Backups were never turned on (US-071a's 1st criterion — nothing exports until they are). */
export class BackupNotEnabledError extends Error {
  constructor() {
    super('backup_not_enabled');
    this.name = 'BackupNotEnabledError';
  }
}

/** The re-typed recovery passphrase doesn't decrypt the payload — wrong on export (US-071a) or
 *  on restore (US-071b), same failure either direction. */
export class WrongRecoveryKeyError extends Error {
  constructor() {
    super('wrong_recovery_key');
    this.name = 'WrongRecoveryKeyError';
  }
}

/** The picked file isn't a Mizaniyati backup (or is a version this app doesn't understand). */
export class InvalidBackupFileError extends Error {
  constructor() {
    super('invalid_backup_file');
    this.name = 'InvalidBackupFileError';
  }
}
