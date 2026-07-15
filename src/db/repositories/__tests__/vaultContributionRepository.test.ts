import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createMember } from '../memberRepository';
import { NotFoundError } from '../errors';
import { createVault } from '../vaultRepository';
import {
  createVaultContribution,
  deleteVaultContribution,
  getVaultContributionById,
  listVaultContributions,
} from '../vaultContributionRepository';

async function seedVaultAndMember(db: ReturnType<typeof createFakeDatabase>['db']) {
  const vault = await createVault(db, {
    name: 'Omra 2027',
    targetMinor: 3000000,
    currencyCode: 'MAD',
  });
  const member = await createMember(db, { name: 'Youssef' });
  return { vault, member };
}

describe('vaultContributionRepository', () => {
  it('creates a contribution and reads it back', async () => {
    const { db } = createFakeDatabase();
    const { vault, member } = await seedVaultAndMember(db);

    const contribution = await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 50000,
      memberId: member.id,
      date: '2026-07-05T10:00:00.000Z',
      note: 'Prime de juin',
    });

    expect(contribution.id).toEqual(expect.any(String));
    expect(await getVaultContributionById(db, contribution.id)).toEqual(contribution);
  });

  it('defaults note to null when omitted', async () => {
    const { db } = createFakeDatabase();
    const { vault, member } = await seedVaultAndMember(db);

    const contribution = await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 50000,
      memberId: member.id,
      date: '2026-07-05T10:00:00.000Z',
    });

    expect(contribution.note).toBeNull();
  });

  it('rejects an unknown vault id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const { member } = await seedVaultAndMember(db);

    await expect(
      createVaultContribution(db, {
        vaultId: 'missing-vault',
        amountMinor: 50000,
        memberId: member.id,
        date: '2026-07-05T10:00:00.000Z',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('rejects a negative amount (CHECK amount_minor >= 0)', async () => {
    const { db } = createFakeDatabase();
    const { vault, member } = await seedVaultAndMember(db);

    await expect(
      createVaultContribution(db, {
        vaultId: vault.id,
        amountMinor: -100,
        memberId: member.id,
        date: '2026-07-05T10:00:00.000Z',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists contributions ordered by date descending', async () => {
    const { db } = createFakeDatabase();
    const { vault, member } = await seedVaultAndMember(db);
    await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 10000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });
    await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 20000,
      memberId: member.id,
      date: '2026-07-03T10:00:00.000Z',
    });

    const contributions = await listVaultContributions(db);
    expect(contributions.map((c) => c.date)).toEqual([
      '2026-07-03T10:00:00.000Z',
      '2026-07-01T10:00:00.000Z',
    ]);
  });

  it('deletes a contribution', async () => {
    const { db } = createFakeDatabase();
    const { vault, member } = await seedVaultAndMember(db);
    const contribution = await createVaultContribution(db, {
      vaultId: vault.id,
      amountMinor: 10000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await deleteVaultContribution(db, contribution.id);

    expect(await getVaultContributionById(db, contribution.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown contribution', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteVaultContribution(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
