import type { Migration } from '../types';

/**
 * Adds `category_budgets.rollover_enabled` — the last field from the `categoryBudget` data model
 * in `docs/specs/categories-plafonds.md` (US-020). Off by default (existing budgets are
 * unaffected). "Report simple, non composé" is enforced in `computeCategoryBudgetStatus`
 * (`src/categories/categoryBudgetStatus.ts`): it only ever looks one month back at that month's
 * own configured cap, never at an already-rolled-over effective cap, so leftovers can't compound
 * across several under-spent months.
 */
export const categoryBudgetRolloverMigration: Migration = {
  version: 6,
  name: 'category_budget_rollover',
  up: `
ALTER TABLE category_budgets ADD COLUMN rollover_enabled INTEGER NOT NULL DEFAULT 0;
`,
};
