import type { Migration } from '../types';

/**
 * `diaspora_beneficiaries` (US-046): the diaspora household's recurring recipients ("Fatima,
 * mère, 300 EUR / mois") — distinct from `members` (people *inside* this household) and from
 * `diaspora_transfers` (one instance of money sent). `usual_amount_minor` is nullable: an
 * "occasional" beneficiary has no habitual amount to prefill.
 *
 * `diaspora_transfers.beneficiary_id` links a transfer to the beneficiary it was sent to — added
 * here rather than in `0022` because that migration predates the beneficiary concept entirely
 * (its own comment already anticipated this). Nullable and without `ON DELETE`: deleting a
 * beneficiary later (US-046's "sans perdre l'historique") never touches past `diaspora_transfers`
 * rows, it just leaves their `beneficiary_id` pointing at a row that's gone — same "append-only
 * ledger, mutate only the label" pattern as `category_id` surviving a category rename elsewhere.
 */
export const diasporaBeneficiariesMigration: Migration = {
  version: 23,
  name: 'diaspora_beneficiaries',
  up: `
CREATE TABLE IF NOT EXISTS diaspora_beneficiaries (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  usual_amount_minor INTEGER CHECK (usual_amount_minor IS NULL OR usual_amount_minor > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'occasional')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE diaspora_transfers ADD COLUMN beneficiary_id TEXT REFERENCES diaspora_beneficiaries(id);
`,
};
