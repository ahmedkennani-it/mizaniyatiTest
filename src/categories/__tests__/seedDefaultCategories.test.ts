import { createCategory, listCategories } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { getDefaultCategories } from '../defaultCategories';
import { seedDefaultCategories } from '../seedDefaultCategories';

describe('seedDefaultCategories', () => {
  it('inserts the default category set with isDefault=true and a sequential orderIndex', async () => {
    const { db } = createFakeDatabase();

    const seeded = await seedDefaultCategories(db, 'fr');

    const expectedNames = getDefaultCategories('fr').map((c) => c.name);
    expect(seeded.map((c) => c.name)).toEqual(expectedNames);
    expect(seeded.every((c) => c.isDefault)).toBe(true);
    expect(seeded.map((c) => c.orderIndex)).toEqual(expectedNames.map((_, index) => index));
  });

  it('seeds Arabic names when the language is ar', async () => {
    const { db } = createFakeDatabase();

    const seeded = await seedDefaultCategories(db, 'ar');

    expect(seeded.map((c) => c.name)).toEqual(getDefaultCategories('ar').map((c) => c.name));
  });

  it('is idempotent: calling it again does not duplicate categories', async () => {
    const { db } = createFakeDatabase();

    await seedDefaultCategories(db, 'fr');
    await seedDefaultCategories(db, 'fr');

    const all = await listCategories(db);
    expect(all).toHaveLength(getDefaultCategories('fr').length);
  });

  it('still seeds defaults when only a custom (non-default) category exists', async () => {
    const { db } = createFakeDatabase();
    await createCategory(db, { name: 'Zakat', icon: 'moon', color: '#123456' });

    const seeded = await seedDefaultCategories(db, 'fr');

    expect(seeded).toHaveLength(getDefaultCategories('fr').length);
    const all = await listCategories(db);
    expect(all).toHaveLength(getDefaultCategories('fr').length + 1);
  });

  /** US-044: a MENA/Gulf household gets "Zakat & dons" seeded as a default; others don't — but it
   * behaves exactly like any other category once it exists, since it flows through the same
   * `createCategory` call with `isDefault: true` (budget/alert/detail are keyed by category id,
   * never by name, so nothing needs to special-case it there). */
  it('seeds Zakat & dons for a MENA/Gulf country, behaving like any other default category', async () => {
    const { db } = createFakeDatabase();

    const seeded = await seedDefaultCategories(db, 'fr', 'MA');

    const zakat = seeded.find((c) => c.name === 'Zakat & dons');
    expect(zakat).toBeDefined();
    expect(zakat?.isDefault).toBe(true);
    expect(zakat?.orderIndex).toBe(seeded.length - 1);
  });

  it('does not seed Zakat & dons for a market outside MENA/Gulf, though it stays creatable by hand', async () => {
    const { db } = createFakeDatabase();

    const seeded = await seedDefaultCategories(db, 'fr', 'FR');
    expect(seeded.some((c) => c.name === 'Zakat & dons')).toBe(false);

    const handCreated = await createCategory(db, {
      name: 'Zakat & dons',
      icon: 'hand-heart',
      color: '#B45309',
    });
    expect(handCreated.isDefault).toBe(false);
    expect((await listCategories(db)).some((c) => c.name === 'Zakat & dons')).toBe(true);
  });
});
