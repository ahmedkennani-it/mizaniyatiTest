import type { Migration } from '../types';

/**
 * Core domain tables: member, category, transaction. `transactions.amount_minor` stores the
 * amount as an integer in the currency's minor unit (e.g. centimes), never a float — paired
 * with `currency_code` (ISO 4217) per the app's money conventions. `type` (income/expense)
 * is intentionally NOT included here; it lands with US-011.
 */
export const coreEntitiesMigration: Migration = {
  version: 1,
  name: 'core_entities',
  up: `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency_code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  occurred_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
`,
};
