import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { Category, CategoryPatch, NewCategory } from './types';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: number;
  order_index: number;
  seasonal_theme_id: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, name, icon, color, is_default, order_index, seasonal_theme_id, created_at, updated_at';

function fromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default === 1,
    orderIndex: row.order_index,
    seasonalThemeId: row.seasonal_theme_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCategory(db: SqlDatabase, input: NewCategory): Promise<Category> {
  const id = generateId();
  const now = new Date().toISOString();
  const isDefault = input.isDefault ?? false;
  const orderIndex = input.orderIndex ?? 0;
  const seasonalThemeId = input.seasonalThemeId ?? null;
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, is_default, order_index, seasonal_theme_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, input.name, input.icon, input.color, isDefault ? 1 : 0, orderIndex, seasonalThemeId, now, now],
  );
  return {
    id,
    name: input.name,
    icon: input.icon,
    color: input.color,
    isDefault,
    orderIndex,
    seasonalThemeId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getCategoryById(db: SqlDatabase, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>(
    `SELECT ${SELECT_COLUMNS} FROM categories WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listCategories(db: SqlDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT ${SELECT_COLUMNS} FROM categories ORDER BY order_index ASC, name ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateCategory(
  db: SqlDatabase,
  id: string,
  patch: CategoryPatch,
): Promise<Category> {
  const existing = await getCategoryById(db, id);
  if (!existing) {
    throw new NotFoundError('Category', id);
  }
  const updated: Category = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync('UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?;', [
    updated.name,
    updated.icon,
    updated.color,
    updated.updatedAt,
    id,
  ]);
  return updated;
}

export async function deleteCategory(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Category', id);
  }
}
