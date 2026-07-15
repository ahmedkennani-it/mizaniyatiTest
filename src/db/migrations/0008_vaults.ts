import type { Migration } from '../types';

/**
 * Adds the `vault`/`vaultContribution` tables from `docs/specs/objectifs-coffres.md` (US-023):
 * a savings goal ("coffre") plus its deposit history ("versements"). `deadline` is nullable —
 * a coffre without one (fonds d'urgence) is a normal, supported state, not a missing value.
 */
export const vaultsMigration: Migration = {
  version: 8,
  name: 'vaults',
  up: `
CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_minor INTEGER NOT NULL CHECK (target_minor >= 0),
  currency_code TEXT NOT NULL,
  deadline TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vault_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  vault_id TEXT NOT NULL REFERENCES vaults(id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  member_id TEXT NOT NULL REFERENCES members(id),
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vault_contributions_vault_id ON vault_contributions(vault_id);
`,
};
