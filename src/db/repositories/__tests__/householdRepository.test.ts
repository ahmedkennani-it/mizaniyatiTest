import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  createHousehold,
  deleteHousehold,
  getHouseholdById,
  listHouseholds,
  updateHousehold,
} from '../householdRepository';

describe('householdRepository', () => {
  it('creates a household and reads it back', async () => {
    const { db } = createFakeDatabase();

    const household = await createHousehold(db, { name: 'Famille Benali', currencyCode: 'MAD' });

    expect(household.id).toEqual(expect.any(String));
    expect(household.name).toBe('Famille Benali');
    expect(household.currencyCode).toBe('MAD');
    expect(await getHouseholdById(db, household.id)).toEqual(household);
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getHouseholdById(db, 'missing')).toBeNull();
  });

  it('lists households ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const first = await createHousehold(db, { name: 'Foyer A', currencyCode: 'MAD' });
    const second = await createHousehold(db, { name: 'Foyer B', currencyCode: 'EUR' });

    const households = await listHouseholds(db);
    expect(households.map((h) => h.id)).toEqual([first.id, second.id]);
  });

  it('updates a household and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const household = await createHousehold(db, { name: 'Foyer', currencyCode: 'MAD' });

    const updated = await updateHousehold(db, household.id, { name: 'Foyer Kennani' });

    expect(updated.name).toBe('Foyer Kennani');
    expect(await getHouseholdById(db, household.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown household', async () => {
    const { db } = createFakeDatabase();
    await expect(updateHousehold(db, 'missing', { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('deletes a household', async () => {
    const { db } = createFakeDatabase();
    const household = await createHousehold(db, { name: 'Foyer', currencyCode: 'MAD' });

    await deleteHousehold(db, household.id);

    expect(await getHouseholdById(db, household.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown household', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteHousehold(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
