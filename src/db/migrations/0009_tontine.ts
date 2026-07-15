import type { Migration } from '../types';

/**
 * Adds the tontine/daret tables from `docs/specs/tontine.md` (US-024): a group, its participants
 * (`tontine_members` — a plain `name` string, not a foreign key into `members`, since a tontine
 * typically includes people outside the household), the payout rounds, and each member's payment
 * status per round. Suivi uniquement — no money ever moves through the app
 * (`.claude/rules/legal-disclaimers.md`).
 */
export const tontineMigration: Migration = {
  version: 9,
  name: 'tontine',
  up: `
CREATE TABLE IF NOT EXISTS tontine_groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  contribution_per_round_minor INTEGER NOT NULL CHECK (contribution_per_round_minor >= 0),
  currency_code TEXT NOT NULL,
  member_count INTEGER NOT NULL CHECK (member_count > 0),
  start_month TEXT NOT NULL,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  last_reminded_month TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tontine_members (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL REFERENCES tontine_groups(id),
  name TEXT NOT NULL,
  round_order INTEGER NOT NULL CHECK (round_order > 0),
  is_self INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tontine_rounds (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL REFERENCES tontine_groups(id),
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  month TEXT NOT NULL,
  beneficiary_member_id TEXT NOT NULL REFERENCES tontine_members(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tontine_payments (
  id TEXT PRIMARY KEY NOT NULL,
  round_id TEXT NOT NULL REFERENCES tontine_rounds(id),
  member_id TEXT NOT NULL REFERENCES tontine_members(id),
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tontine_members_group_id ON tontine_members(group_id);
CREATE INDEX IF NOT EXISTS idx_tontine_rounds_group_id ON tontine_rounds(group_id);
CREATE INDEX IF NOT EXISTS idx_tontine_payments_round_id ON tontine_payments(round_id);
`,
};
