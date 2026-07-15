import type { Migration } from '../types';

/**
 * Adds the Zakat tables from `docs/specs/zakat.md` (US-025): `zakat_config` is a single
 * fixed-`id='default'` row (same one-row convention as `notification_settings`) holding the
 * household's madhhab/nisab-basis choice and manually-entered gold/silver price per gram (no
 * live price feed is wired up yet). `zakat_assessments` is an append-only history of saved
 * calculations — never edited, only created.
 */
export const zakatMigration: Migration = {
  version: 10,
  name: 'zakat',
  up: `
CREATE TABLE IF NOT EXISTS zakat_config (
  id TEXT PRIMARY KEY NOT NULL,
  madhhab TEXT NOT NULL DEFAULT '',
  nisab_basis TEXT NOT NULL DEFAULT 'gold',
  gold_price_per_gram_minor INTEGER,
  silver_price_per_gram_minor INTEGER,
  price_updated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS zakat_assessments (
  id TEXT PRIMARY KEY NOT NULL,
  cash_minor INTEGER NOT NULL CHECK (cash_minor >= 0),
  gold_silver_minor INTEGER NOT NULL CHECK (gold_silver_minor >= 0),
  investments_minor INTEGER NOT NULL CHECK (investments_minor >= 0),
  debts_minor INTEGER NOT NULL CHECK (debts_minor >= 0),
  base_minor INTEGER NOT NULL CHECK (base_minor >= 0),
  due_minor INTEGER NOT NULL CHECK (due_minor >= 0),
  above_nisab INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`,
};
