import type { Migration } from '../types';

/**
 * Adds Zakat-planning columns to `zakat_assessments` (US-043): a chosen `due_date` for the
 * reminder, and `paid_at`/`transaction_id` — nullable, so `paid_at IS NULL` alone means "still
 * planned" (same single-source-of-truth pattern as `tontine_rounds.closed_at`, rather than a
 * separate status enum that could disagree with it). `transaction_id` links to the real expense
 * transaction created once the household marks the Zakat as paid, so it counts toward the "Zakat
 * & dons" category's monthly cap like any other expense. `reminded_at` prevents the reminder from
 * firing more than once for the same planned Zakat.
 */
export const zakatPlanningMigration: Migration = {
  version: 21,
  name: 'zakat_planning',
  up: `
ALTER TABLE zakat_assessments ADD COLUMN due_date TEXT;
ALTER TABLE zakat_assessments ADD COLUMN paid_at TEXT;
ALTER TABLE zakat_assessments ADD COLUMN transaction_id TEXT REFERENCES transactions(id);
ALTER TABLE zakat_assessments ADD COLUMN reminded_at TEXT;
`,
};
