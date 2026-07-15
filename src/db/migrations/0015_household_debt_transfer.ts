import type { Migration } from '../types';

/**
 * Base schema for three domain entities named in the data-model foundation (task 1.3):
 * `households` (the family budget container), `debts` ("dettes" — money the household is owed or
 * owes, to a free-text counterparty) and `transfers` ("virements" — moving money between two
 * household members). These tables are journaled locally like the rest of the schema — no real
 * account is ever touched. Later phases build the screens on top of them.
 */
export const householdDebtTransferMigration: Migration = {
  version: 15,
  name: 'household_debt_transfer',
  up: `
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('owed_to_household', 'household_owes')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency_code TEXT NOT NULL,
  due_date TEXT,
  settled INTEGER NOT NULL DEFAULT 0 CHECK (settled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency_code TEXT NOT NULL,
  from_member_id TEXT NOT NULL REFERENCES members(id),
  to_member_id TEXT NOT NULL REFERENCES members(id),
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transfers_from_member_id ON transfers(from_member_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_member_id ON transfers(to_member_id);
`,
};
