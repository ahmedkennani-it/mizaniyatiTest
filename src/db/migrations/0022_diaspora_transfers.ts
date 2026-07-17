import type { Migration } from '../types';

/**
 * `diaspora_transfers` (US-045): the append-only ledger behind the Transferts tab's annual
 * tracker — one row per money transfer a diaspora household sends "back home". Deliberately
 * separate from the pre-existing `transfers` table (`0015_household_debt_transfer`), which is an
 * unrelated feature (a "virement" between two members *within* the same household). No
 * beneficiary/method/rate columns yet — those land with US-046/US-047 as their own migrations,
 * same incremental pattern as `zakat_assessments` gaining `due_date`/`paid_at` later in
 * `0021_zakat_planning`.
 */
export const diasporaTransfersMigration: Migration = {
  version: 22,
  name: 'diaspora_transfers',
  up: `
CREATE TABLE IF NOT EXISTS diaspora_transfers (
  id TEXT PRIMARY KEY NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency_code TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`,
};
