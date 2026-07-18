import { createCategory, listCategories, updateCategory } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { getDefaultCategories } from '../defaultCategories';
import { reconcileMarketCategories, seedDefaultCategories } from '../seedDefaultCategories';

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

describe('reconcileMarketCategories (US-063)', () => {
  it('adds the new market\'s missing default categories after a country change', async () => {
    const { db } = createFakeDatabase();
    await seedDefaultCategories(db, 'fr', 'MA'); // 9 base + Zakat, no remittance category

    const created = await reconcileMarketCategories(db, 'fr', 'FR');

    expect(created.map((c) => c.name)).toEqual(['Transfert famille']);
    const all = await listCategories(db);
    expect(all).toHaveLength(11); // 10 existing + the new remittance category
  });

  it('never touches, renames, or removes an existing category', async () => {
    const { db } = createFakeDatabase();
    const seeded = await seedDefaultCategories(db, 'fr', 'MA');
    const courses = seeded.find((c) => c.name === 'Courses');
    await updateCategory(db, courses!.id, { name: 'Épicerie du quartier' }); // household's own rename

    await reconcileMarketCategories(db, 'fr', 'FR');

    const all = await listCategories(db);
    const stillRenamed = all.find((c) => c.id === courses!.id);
    expect(stillRenamed?.name).toBe('Épicerie du quartier');
    expect(all).toHaveLength(11);
  });

  it('is a no-op once the new market has no missing category (already reconciled, or same market)', async () => {
    const { db } = createFakeDatabase();
    await seedDefaultCategories(db, 'fr', 'FR');

    const created = await reconcileMarketCategories(db, 'fr', 'FR');

    expect(created).toEqual([]);
    expect(await listCategories(db)).toHaveLength(getDefaultCategories('fr', 'FR').length);
  });

  it('adds only Zakat when moving from a diaspora to a Gulf market — the remittance icon already exists', async () => {
    const { db } = createFakeDatabase();
    await seedDefaultCategories(db, 'fr', 'FR'); // 9 base + "Transfert famille" (icon: plane)

    const created = await reconcileMarketCategories(db, 'fr', 'AE');

    // Not a duplicate "plane"-icon category, and not renamed to the Gulf wording either — same
    // "never touch an existing category" rule already covered for the school slot above.
    expect(created.map((c) => c.name)).toEqual(['Zakat & dons']);
    const all = await listCategories(db);
    expect(all.filter((c) => c.icon === 'plane')).toHaveLength(1);
    expect(all.find((c) => c.icon === 'plane')?.name).toBe('Transfert famille');
  });

  it('appends new categories after the existing highest orderIndex, never inserting mid-list', async () => {
    const { db } = createFakeDatabase();
    const seeded = await seedDefaultCategories(db, 'fr', 'MA');
    const maxExistingOrder = Math.max(...seeded.map((c) => c.orderIndex));

    const created = await reconcileMarketCategories(db, 'fr', 'FR');

    expect(created[0].orderIndex).toBe(maxExistingOrder + 1);
  });

  it('does not re-add a category whose icon already exists, even under a different market\'s wording', async () => {
    const { db } = createFakeDatabase();
    await seedDefaultCategories(db, 'fr', 'MA'); // "École" (base wording), tontine only

    // Moving to a Gulf market would normally relabel the school slot to "Écoles des enfants", but
    // an existing category (by icon) is never touched or duplicated by reconciliation.
    await reconcileMarketCategories(db, 'fr', 'AE');

    const all = await listCategories(db);
    expect(all.filter((c) => c.icon === 'school')).toHaveLength(1);
    expect(all.find((c) => c.icon === 'school')?.name).toBe('École');
  });
});
