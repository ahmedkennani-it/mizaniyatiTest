import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import {
  createCategory,
  createHousehold,
  createMember,
  createTransaction,
  createVault,
  createVaultContribution,
} from '../../db/repositories';
import { buildBackupPayload } from '../backupPayload';

describe('buildBackupPayload (US-071a/US-071b)', () => {
  it('collects the household, members, categories, transactions, vaults, and contributions', async () => {
    const { db } = createFakeDatabase();
    const household = await createHousehold(db, { name: 'Famille Benali', currencyCode: 'MAD' });
    const member = await createMember(db, { name: 'Youssef' });
    const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#0D9488' });
    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });
    const vault = await createVault(db, { name: 'Vacances', targetMinor: 100000, currencyCode: 'MAD' });
    const contribution = await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 10000,
      memberId: member.id,
      date: '2026-07-05T10:00:00.000Z',
    });

    const payload = await buildBackupPayload(db);

    expect(payload.version).toBe(1);
    expect(payload.exportedAt).toEqual(expect.any(String));
    expect(payload.households).toEqual([household]);
    expect(payload.members).toEqual([member]);
    expect(payload.categories).toEqual([category]);
    expect(payload.transactions).toEqual([transaction]);
    expect(payload.vaults).toEqual([vault]);
    expect(payload.vaultContributions).toEqual([contribution]);
  });

  it('is empty but well-formed for a freshly created household', async () => {
    const { db } = createFakeDatabase();

    const payload = await buildBackupPayload(db);

    expect(payload).toMatchObject({
      version: 1,
      households: [],
      members: [],
      categories: [],
      transactions: [],
      vaults: [],
      vaultContributions: [],
    });
  });
});
