import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { CategoryBudget, CategoryBudgetPatch, NewCategoryBudget } from './types';

interface CategoryBudgetRow {
  id: string;
  category_id: string;
  month: string;
  cap_minor: number;
  alert_threshold_minor: number;
  last_alerted_month: string | null;
  rollover_enabled: number;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, category_id, month, cap_minor, alert_threshold_minor, last_alerted_month, rollover_enabled, created_at, updated_at';

function fromRow(row: CategoryBudgetRow): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    capMinor: row.cap_minor,
    alertThresholdMinor: row.alert_threshold_minor,
    lastAlertedMonth: row.last_alerted_month,
    rolloverEnabled: row.rollover_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCategoryBudget(
  db: SqlDatabase,
  input: NewCategoryBudget,
): Promise<CategoryBudget> {
  const id = generateId();
  const now = new Date().toISOString();
  const rolloverEnabled = input.rolloverEnabled ?? false;
  await db.runAsync(
    `INSERT INTO category_budgets (id, category_id, month, cap_minor, alert_threshold_minor, last_alerted_month, rollover_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.categoryId,
      input.month,
      input.capMinor,
      input.alertThresholdMinor,
      null,
      rolloverEnabled ? 1 : 0,
      now,
      now,
    ],
  );
  return {
    id,
    categoryId: input.categoryId,
    month: input.month,
    capMinor: input.capMinor,
    alertThresholdMinor: input.alertThresholdMinor,
    lastAlertedMonth: null,
    rolloverEnabled,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getCategoryBudgetById(
  db: SqlDatabase,
  id: string,
): Promise<CategoryBudget | null> {
  const row = await db.getFirstAsync<CategoryBudgetRow>(
    `SELECT ${SELECT_COLUMNS} FROM category_budgets WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listCategoryBudgets(db: SqlDatabase): Promise<CategoryBudget[]> {
  const rows = await db.getAllAsync<CategoryBudgetRow>(
    `SELECT ${SELECT_COLUMNS} FROM category_budgets ORDER BY category_id ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateCategoryBudget(
  db: SqlDatabase,
  id: string,
  patch: CategoryBudgetPatch,
): Promise<CategoryBudget> {
  const existing = await getCategoryBudgetById(db, id);
  if (!existing) {
    throw new NotFoundError('CategoryBudget', id);
  }
  const updated: CategoryBudget = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE category_budgets SET month = ?, cap_minor = ?, alert_threshold_minor = ?, last_alerted_month = ?, rollover_enabled = ?, updated_at = ? WHERE id = ?;',
    [
      updated.month,
      updated.capMinor,
      updated.alertThresholdMinor,
      updated.lastAlertedMonth,
      updated.rolloverEnabled ? 1 : 0,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

/**
 * Finds the budget already configured for `categoryId` (there is at most one — see the
 * `category_budgets` migration comment) and updates it in place, or creates a new one if none
 * exists yet. This is the single entry point UI code should use to save a plafond/seuil edit,
 * rather than calling `createCategoryBudget`/`updateCategoryBudget` directly.
 */
export async function upsertCategoryBudget(
  db: SqlDatabase,
  categoryId: string,
  input: { month: string; capMinor: number; alertThresholdMinor: number; rolloverEnabled?: boolean },
): Promise<CategoryBudget> {
  const existing = (await listCategoryBudgets(db)).find((budget) => budget.categoryId === categoryId);
  if (existing) {
    return updateCategoryBudget(db, existing.id, input);
  }
  return createCategoryBudget(db, { categoryId, ...input });
}
