const mockWriteLocalBackup = jest.fn((content: string) => Promise.resolve(`file:///backups/${content.length}.mzb`));
const mockShare = jest.fn((_uri: string) => Promise.resolve());
const mockDeleteLocalBackup = jest.fn(() => Promise.resolve());

// Indirection (arrow functions, not the mocks assigned directly) so the factory only reads
// `mockWriteLocalBackup`/etc. when actually called — by then the `const`s above have long since
// initialized. Referencing them directly as values here would capture them before that, mirroring
// `PaywallScreen.test.tsx`'s `mockPurchasePro` wrapping for the same reason.
jest.mock('../backupFileClient', () => ({
  backupFileClient: {
    writeLocalBackup: (content: string) => mockWriteLocalBackup(content),
    share: (uri: string) => mockShare(uri),
    deleteLocalBackup: () => mockDeleteLocalBackup(),
  },
}));

const mockStore = new Map<string, string>();
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
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { createCategory, createHousehold, createMember, createTransaction } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { decryptWithKey, deriveBackupKey } from '../backupCrypto';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { enableBackup, getBackupSettings } from '../backupSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { BackupNotEnabledError, WrongRecoveryKeyError, exportBackup } from '../exportBackup';

describe('exportBackup (US-071a)', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('refuses to export when backups have never been enabled', async () => {
    const { db } = createFakeDatabase();

    await expect(exportBackup(db, 'anything')).rejects.toThrow(BackupNotEnabledError);
    expect(mockWriteLocalBackup).not.toHaveBeenCalled();
  });

  it('refuses to export with the wrong recovery key', async () => {
    const { db } = createFakeDatabase();
    await enableBackup('correct horse battery staple');

    await expect(exportBackup(db, 'wrong passphrase')).rejects.toThrow(WrongRecoveryKeyError);
    expect(mockWriteLocalBackup).not.toHaveBeenCalled();
  });

  it('encrypts the household data before writing it anywhere, and hands it to the share sheet', async () => {
    const { db } = createFakeDatabase();
    await createHousehold(db, { name: 'Famille Benali', currencyCode: 'MAD' });
    const member = await createMember(db, { name: 'Youssef' });
    const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#0D9488' });
    await createTransaction(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });
    const settings = await enableBackup('correct horse battery staple');

    const result = await exportBackup(db, 'correct horse battery staple');

    expect(mockWriteLocalBackup).toHaveBeenCalledTimes(1);
    const writtenContent: string = mockWriteLocalBackup.mock.calls[0][0];
    expect(writtenContent).not.toContain('Famille Benali');
    expect(writtenContent).not.toContain('Youssef');
    expect(writtenContent).not.toContain('Courses');

    const file = JSON.parse(writtenContent) as { version: number; salt: string; ciphertext: string };
    expect(file.version).toBe(1);
    expect(file.salt).toBe(settings.recoveryKeySalt);
    const key = deriveBackupKey('correct horse battery staple', file.salt);
    const decrypted = JSON.parse(decryptWithKey(file.ciphertext, key));
    expect(decrypted.households[0].name).toBe('Famille Benali');
    expect(decrypted.transactions).toHaveLength(1);

    expect(mockShare).toHaveBeenCalledWith(result.uri);
    expect((await getBackupSettings()).lastBackupAt).toEqual(expect.any(String));
  });
});
