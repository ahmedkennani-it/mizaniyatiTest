const mockStore = new Map<string, string>();

// Same reasoning as appLockSettings.test.ts: the real cryptoClient no-ops under Jest, which would
// make every recovery key hash to the same value — faked deterministically so "wrong key" tests
// are meaningful.
jest.mock('../../security/cryptoClient', () => ({
  cryptoClient: {
    digestSha256Hex: jest.fn((value: string) => Promise.resolve(`digest(${value})`)),
    randomHex: jest.fn(() => Promise.resolve('deadbeef')),
  },
}));

jest.mock('../../security/secureStoreClient', () => ({
  secureStoreClient: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve();
    }),
    deleteItem: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
  },
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import {
  disableBackup,
  enableBackup,
  getBackupSettings,
  recordBackupSuccess,
  verifyRecoveryKey,
} from '../backupSettings';

describe('backupSettings (US-071a)', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('defaults to disabled, with no recovery key and no backup yet', async () => {
    const settings = await getBackupSettings();
    expect(settings).toEqual({
      enabled: false,
      recoveryKeySalt: null,
      recoveryKeyHash: null,
      lastBackupAt: null,
    });
  });

  it('enables backups and stores a recovery key hash, not the key itself', async () => {
    const settings = await enableBackup('correct horse battery staple');

    expect(settings.enabled).toBe(true);
    expect(settings.recoveryKeyHash).toEqual(expect.any(String));
    // `BackupSettings` has no field for the raw key at all — only a salt and a verification hash
    // are ever persisted (enforced by the type, not just this assertion).
    expect(Object.keys(settings).sort()).toEqual(
      ['enabled', 'lastBackupAt', 'recoveryKeyHash', 'recoveryKeySalt'].sort(),
    );
    expect(await getBackupSettings()).toEqual(settings);
  });

  it('verifies a correct recovery key', async () => {
    const settings = await enableBackup('correct horse battery staple');
    expect(await verifyRecoveryKey('correct horse battery staple', settings)).toBe(true);
  });

  it('rejects an incorrect recovery key', async () => {
    const settings = await enableBackup('correct horse battery staple');
    expect(await verifyRecoveryKey('wrong passphrase', settings)).toBe(false);
  });

  it('rejects any key when backups were never enabled', async () => {
    const settings = await getBackupSettings();
    expect(await verifyRecoveryKey('anything', settings)).toBe(false);
  });

  /** US-071a's 3rd criterion: disabling forgets the recovery key and the backup history. */
  it('disables backups, clearing the recovery key and the last-backup date', async () => {
    await enableBackup('correct horse battery staple');
    await recordBackupSuccess();

    const settings = await disableBackup();

    expect(settings).toEqual({
      enabled: false,
      recoveryKeySalt: null,
      recoveryKeyHash: null,
      lastBackupAt: null,
    });
  });

  /** US-071b's 2nd criterion: the settings screen reads this back. */
  it('records the last successful backup date', async () => {
    await enableBackup('correct horse battery staple');
    expect((await getBackupSettings()).lastBackupAt).toBeNull();

    const settings = await recordBackupSuccess();

    expect(settings.lastBackupAt).toEqual(expect.any(String));
    expect(await getBackupSettings()).toEqual(settings);
  });
});
