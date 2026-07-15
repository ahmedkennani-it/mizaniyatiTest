import type { Migration } from '../types';

/**
 * Adds the `categoryBudget` table from `docs/specs/categories-plafonds.md` (US-018): a monthly
 * cap + alert threshold per category. Only **one active row per category** is used for now — the
 * repository layer enforces that invariant (find-or-create on `category_id`, mirroring
 * `seedDefaultCategories`'s idempotency-by-application-logic pattern) rather than a SQL UNIQUE
 * constraint. `month` records when the cap was last (re)configured; real per-month history
 * (needed for report/rollover, US-020) isn't built until that story needs it.
 */
export const categoryBudgetsMigration: Migration = {
  version: 4,
  name: 'category_budgets',
  up: `
CREATE TABLE IF NOT EXISTS category_budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  month TEXT NOT NULL,
  cap_minor INTEGER NOT NULL CHECK (cap_minor >= 0),
  alert_threshold_minor INTEGER NOT NULL CHECK (alert_threshold_minor >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_budgets_category_id ON category_budgets(category_id);
`,
};
