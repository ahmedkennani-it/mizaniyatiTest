import type { Migration } from '../types';

/**
 * Adds the `recurringRule` table from `docs/specs/transactions-recurrentes.md` (US-021): a
 * template (montant, catégorie, membre, fréquence, mode) that `recurringOccurrences.ts` turns
 * into due dates — this migration only stores the rule itself, not generated transactions.
 * `day_of_month`/`weekday` are both nullable since only one applies depending on `frequency`
 * (mirrors the spec's `dayOfMonth|weekday` union).
 */
export const recurringRulesMigration: Migration = {
  version: 7,
  name: 'recurring_rules',
  up: `
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency_code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  frequency TEXT NOT NULL,
  day_of_month INTEGER,
  weekday INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT,
  mode TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0,
  last_run_date TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_category_id ON recurring_rules(category_id);
`,
};
