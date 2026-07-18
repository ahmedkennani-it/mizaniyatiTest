import type { Migration } from '../types';

/**
 * `debts` gains two columns (US-049/US-050): `date` (the loan date itself — distinct from
 * `due_date`, the agreed repayment deadline, and from `created_at`, just an audit timestamp; a
 * household can log a loan made last week) and `reminded_at` (same "fire once" guard already used
 * by `zakat_assessments`/`tontine_rounds`). Both existed nowhere before this — `0015` predates the
 * screens that need them.
 *
 * `debt_repayments` (US-050): append-only ledger of partial/total repayments against a debt, same
 * shape as `vault_contributions` against a `Vault`. Deliberately **no stored "settled" status
 * derived from repayments** — `remainingMinor = debt.amountMinor - sum(repayments)` is computed
 * live (`computeDebtStatus`), so it can never diverge from the repayment history the way a second,
 * independently-updated flag could. The pre-existing `debts.settled` column is left in the schema
 * but unused by this logic.
 */
export const debtRepaymentsMigration: Migration = {
  version: 25,
  name: 'debt_repayments',
  up: `
ALTER TABLE debts ADD COLUMN date TEXT NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE debts ADD COLUMN reminded_at TEXT;

CREATE TABLE IF NOT EXISTS debt_repayments (
  id TEXT PRIMARY KEY NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt_id ON debt_repayments(debt_id);
`,
};
