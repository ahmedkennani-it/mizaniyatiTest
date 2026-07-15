import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createCategory } from '../categoryRepository';
import {
  createCategoryBudget,
  getCategoryBudgetById,
  listCategoryBudgets,
  updateCategoryBudget,
  upsertCategoryBudget,
} from '../categoryBudgetRepository';
import { NotFoundError } from '../errors';

describe('categoryBudgetRepository', () => {
  it('creates a budget and reads it back', async () => {
    const { db } = createFakeDatabase();
    const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#1E7B34' });

    const budget = await createCategoryBudget(db, {
      categoryId: category.id,
      month: '2026-07',
      capMinor: 100000,
      alertThresholdMinor: 80000,
    });

    expect(budget.id).toEqual(expect.any(String));
    expect(await getCategoryBudgetById(db, budget.id)).toEqual(budget);
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getCategoryBudgetById(db, 'missing')).toBeNull();
  });

  it('updates a budget and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#1E7B34' });
    const budget = await createCategoryBudget(db, {
      categoryId: category.id,
      month: '2026-07',
      capMinor: 100000,
      alertThresholdMinor: 80000,
    });

    const updated = await updateCategoryBudget(db, budget.id, { capMinor: 150000, alertThresholdMinor: 120000 });

    expect(updated.capMinor).toBe(150000);
    expect(updated.alertThresholdMinor).toBe(120000);
    expect(await getCategoryBudgetById(db, budget.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown budget', async () => {
    const { db } = createFakeDatabase();
    await expect(updateCategoryBudget(db, 'missing', { capMinor: 100 })).rejects.toThrow(NotFoundError);
  });

  describe('upsertCategoryBudget', () => {
    it('creates a new budget when the category has none yet', async () => {
      const { db } = createFakeDatabase();
      const category = await createCategory(db, { name: 'Santé', icon: 'health', color: '#0000FF' });

      const budget = await upsertCategoryBudget(db, category.id, {
        month: '2026-07',
        capMinor: 50000,
        alertThresholdMinor: 40000,
      });

      const all = await listCategoryBudgets(db);
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(budget);
    });

    it('updates the existing budget in place instead of creating a second row (one active row per category)', async () => {
      const { db } = createFakeDatabase();
      const category = await createCategory(db, { name: 'Santé', icon: 'health', color: '#0000FF' });
      const first = await upsertCategoryBudget(db, category.id, {
        month: '2026-06',
        capMinor: 50000,
        alertThresholdMinor: 40000,
      });

      const second = await upsertCategoryBudget(db, category.id, {
        month: '2026-07',
        capMinor: 70000,
        alertThresholdMinor: 60000,
      });

      expect(second.id).toBe(first.id);
      const all = await listCategoryBudgets(db);
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({ month: '2026-07', capMinor: 70000, alertThresholdMinor: 60000 });
    });
  });
});
