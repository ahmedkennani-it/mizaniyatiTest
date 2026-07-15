import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from '../categoryRepository';
import { NotFoundError } from '../errors';

describe('categoryRepository', () => {
  it('creates a category and reads it back', async () => {
    const { db } = createFakeDatabase();
    const category = await createCategory(db, { name: 'Alimentation', icon: 'cart', color: '#00FF00' });

    expect(category.id).toEqual(expect.any(String));
    expect(category.name).toBe('Alimentation');
    expect(category.icon).toBe('cart');
    expect(category.color).toBe('#00FF00');
    expect(await getCategoryById(db, category.id)).toEqual(category);
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getCategoryById(db, 'missing')).toBeNull();
  });

  it('lists categories ordered by name', async () => {
    const { db } = createFakeDatabase();
    await createCategory(db, { name: 'Transport', icon: 'car', color: '#000000' });
    await createCategory(db, { name: 'Alimentation', icon: 'cart', color: '#00FF00' });

    const categories = await listCategories(db);
    expect(categories.map((c) => c.name)).toEqual(['Alimentation', 'Transport']);
  });

  it('updates a category and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const category = await createCategory(db, { name: 'Loisirs', icon: 'game', color: '#FF0000' });

    const updated = await updateCategory(db, category.id, { name: 'Loisirs & Sorties' });

    expect(updated.name).toBe('Loisirs & Sorties');
    expect(await getCategoryById(db, category.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown category', async () => {
    const { db } = createFakeDatabase();
    await expect(updateCategory(db, 'missing', { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('deletes a category', async () => {
    const { db } = createFakeDatabase();
    const category = await createCategory(db, { name: 'Santé', icon: 'health', color: '#0000FF' });

    await deleteCategory(db, category.id);

    expect(await getCategoryById(db, category.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown category', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteCategory(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
