import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  createVault,
  deleteVault,
  getVaultById,
  listVaults,
  updateVault,
} from '../vaultRepository';

describe('vaultRepository', () => {
  it('creates a vault with a deadline and reads it back', async () => {
    const { db } = createFakeDatabase();

    const vault = await createVault(db, {
      name: 'Omra 2027',
      targetMinor: 3000000,
      currencyCode: 'MAD',
      deadline: '2027-06-01',
    });

    expect(vault.id).toEqual(expect.any(String));
    expect(vault.deadline).toBe('2027-06-01');
    expect(await getVaultById(db, vault.id)).toEqual(vault);
  });

  it("creates a vault without a deadline (fonds d'urgence)", async () => {
    const { db } = createFakeDatabase();

    const vault = await createVault(db, {
      name: "Fonds d'urgence",
      targetMinor: 1000000,
      currencyCode: 'MAD',
    });

    expect(vault.deadline).toBeNull();
  });

  it('rejects a negative target (CHECK target_minor >= 0)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createVault(db, { name: 'Voiture', targetMinor: -100, currencyCode: 'MAD' }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getVaultById(db, 'missing')).toBeNull();
  });

  it('lists vaults ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const first = await createVault(db, { name: 'Omra', targetMinor: 100000, currencyCode: 'MAD' });
    const second = await createVault(db, {
      name: 'Voiture',
      targetMinor: 500000,
      currencyCode: 'MAD',
    });

    const vaults = await listVaults(db);
    expect(vaults.map((v) => v.id)).toEqual([first.id, second.id]);
  });

  it('updates a vault and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const vault = await createVault(db, { name: 'Omra', targetMinor: 100000, currencyCode: 'MAD' });

    const updated = await updateVault(db, vault.id, {
      targetMinor: 150000,
      deadline: '2027-01-01',
    });

    expect(updated.targetMinor).toBe(150000);
    expect(updated.deadline).toBe('2027-01-01');
    expect(await getVaultById(db, vault.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown vault', async () => {
    const { db } = createFakeDatabase();
    await expect(updateVault(db, 'missing', { targetMinor: 100 })).rejects.toThrow(NotFoundError);
  });

  it('deletes a vault', async () => {
    const { db } = createFakeDatabase();
    const vault = await createVault(db, { name: 'Omra', targetMinor: 100000, currencyCode: 'MAD' });

    await deleteVault(db, vault.id);

    expect(await getVaultById(db, vault.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown vault', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteVault(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
