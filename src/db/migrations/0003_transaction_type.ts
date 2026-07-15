import type { Migration } from '../types';

/**
 * Adds the `type` (`'expense'|'income'`) field from the `transaction` model in
 * `docs/specs/saisie-depense.md` (US-011) — deliberately left out of migration 0001, whose own
 * comment deferred it to this story. Existing rows (all created as expenses before this) default
 * to `'expense'`, matching how they were actually recorded.
 */
export const transactionTypeMigration: Migration = {
  version: 3,
  name: 'transaction_type',
  up: `
ALTER TABLE transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';
`,
};
