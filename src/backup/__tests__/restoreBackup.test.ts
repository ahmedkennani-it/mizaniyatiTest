import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import {
  createCategory,
  createHousehold,
  createMember,
  createTransaction,
  createVault,
  createVaultContribution,
  listCategories,
  listHouseholds,
  listMembers,
  listTransactions,
  listVaultContributions,
  listVaults,
  removeMember,
} from '../../db/repositories';
import { buildBackupPayload } from '../backupPayload';
import { deriveBackupKey, encryptWithKey } from '../backupCrypto';
import { InvalidBackupFileError, WrongRecoveryKeyError, restoreBackup } from '../restoreBackup';

const SALT = 'deadbeef';
const RECOVERY_KEY = 'correct horse battery staple';

async function seedFullHousehold(db: ReturnType<typeof createFakeDatabase>['db']) {
  const household = await createHousehold(db, { name: 'Famille Benali', currencyCode: 'MAD' });
  const youssef = await createMember(db, { name: 'Youssef' });
  const salma = await createMember(db, { name: 'Salma' });
  await removeMember(db, salma.id, '2026-01-01T00:00:00.000Z');
  const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  const transaction = await createTransaction(db, {
    type: 'expense',
    amountMinor: 5000,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: youssef.id,
    occurredAt: '2026-07-05T10:00:00.000Z',
    note: 'Marché',
  });
  const vault = await createVault(db, { name: 'Vacances', targetMinor: 100000, currencyCode: 'MAD' });
  const contribution = await createVaultContribution(db, {
    vaultId: vault.id,
    amountMinor: 10000,
    memberId: youssef.id,
    date: '2026-07-05T10:00:00.000Z',
  });
  return { household, youssef, salma, category, transaction, vault, contribution };
}

async function buildEncryptedFile(db: ReturnType<typeof createFakeDatabase>['db']) {
  const payload = await buildBackupPayload(db);
  const key = deriveBackupKey(RECOVERY_KEY, SALT);
  const ciphertext = encryptWithKey(JSON.stringify(payload), key);
  return JSON.stringify({ version: 1, salt: SALT, ciphertext });
}

describe('restoreBackup (US-071b)', () => {
  /** The criterion's named scenario: a device with nothing on it yet. */
  it('reconstitutes household, members, categories, transactions and goals on a blank device', async () => {
    const source = createFakeDatabase();
    await seedFullHousehold(source.db);
    const file = await buildEncryptedFile(source.db);

    const target = createFakeDatabase();
    const counts = await restoreBackup(target.db, file, RECOVERY_KEY);

    expect(counts).toEqual({
      households: 1,
      members: 2,
      categories: 1,
      transactions: 1,
      vaults: 1,
      vaultContributions: 1,
    });

    const households = await listHouseholds(target.db);
    expect(households).toHaveLength(1);
    expect(households[0].name).toBe('Famille Benali');
    expect(households[0].currencyCode).toBe('MAD');

    const members = await listMembers(target.db);
    expect(members.map((member) => member.name).sort()).toEqual(['Youssef']);

    const categories = await listCategories(target.db);
    expect(categories.map((category) => category.name)).toEqual(['Courses']);

    const transactions = await listTransactions(target.db);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amountMinor).toBe(5000);
    expect(transactions[0].note).toBe('Marché');
    // The restored transaction must point at the *new* category/member ids, not the source's.
    expect(transactions[0].categoryId).toBe(categories[0].id);
    expect(transactions[0].categoryId).not.toBe((await listCategories(source.db))[0].id);

    const vaults = await listVaults(target.db);
    expect(vaults.map((vault) => vault.name)).toEqual(['Vacances']);
    const contributions = await listVaultContributions(target.db);
    expect(contributions).toHaveLength(1);
    expect(contributions[0].vaultId).toBe(vaults[0].id);
  });

  it('preserves a removed member as removed, not active', async () => {
    const source = createFakeDatabase();
    await seedFullHousehold(source.db);
    const file = await buildEncryptedFile(source.db);

    const target = createFakeDatabase();
    await restoreBackup(target.db, file, RECOVERY_KEY);

    const active = await listMembers(target.db);
    expect(active.map((member) => member.name)).toEqual(['Youssef']);
  });

  /** A reinstall: onboarding already seeded a starter household before the household ever reaches
   *  the restore screen — restoring must replace it, not refuse or duplicate. */
  it('replaces an existing (freshly onboarded) household rather than duplicating it', async () => {
    const source = createFakeDatabase();
    await seedFullHousehold(source.db);
    const file = await buildEncryptedFile(source.db);

    const target = createFakeDatabase();
    await createHousehold(target.db, { name: 'Foyer temporaire', currencyCode: 'MAD' });
    await createMember(target.db, { name: 'Moi' });

    await restoreBackup(target.db, file, RECOVERY_KEY);

    const households = await listHouseholds(target.db);
    expect(households).toHaveLength(1);
    expect(households[0].name).toBe('Famille Benali');
    const members = await listMembers(target.db);
    expect(members.map((member) => member.name)).toEqual(['Youssef']);
  });

  it('rejects the wrong recovery key without touching whatever was already on the device', async () => {
    const source = createFakeDatabase();
    await seedFullHousehold(source.db);
    const file = await buildEncryptedFile(source.db);

    const target = createFakeDatabase();
    await createHousehold(target.db, { name: 'Foyer existant', currencyCode: 'MAD' });

    await expect(restoreBackup(target.db, file, 'wrong passphrase')).rejects.toThrow(
      WrongRecoveryKeyError,
    );

    const households = await listHouseholds(target.db);
    expect(households).toHaveLength(1);
    expect(households[0].name).toBe('Foyer existant');
  });

  it('rejects a file that is not valid JSON', async () => {
    const { db } = createFakeDatabase();
    await expect(restoreBackup(db, 'not json at all', RECOVERY_KEY)).rejects.toThrow(
      InvalidBackupFileError,
    );
  });

  it('rejects a JSON file missing the expected backup shape', async () => {
    const { db } = createFakeDatabase();
    await expect(restoreBackup(db, JSON.stringify({ hello: 'world' }), RECOVERY_KEY)).rejects.toThrow(
      InvalidBackupFileError,
    );
  });
});
