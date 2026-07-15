import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewTontineGroup, TontineGroup, TontineGroupPatch } from './types';

interface TontineGroupRow {
  id: string;
  name: string;
  contribution_per_round_minor: number;
  currency_code: string;
  member_count: number;
  start_month: string;
  reminder_enabled: number;
  last_reminded_month: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, name, contribution_per_round_minor, currency_code, member_count, start_month, reminder_enabled, last_reminded_month, created_at, updated_at';

function fromRow(row: TontineGroupRow): TontineGroup {
  return {
    id: row.id,
    name: row.name,
    contributionPerRoundMinor: row.contribution_per_round_minor,
    currencyCode: row.currency_code,
    memberCount: row.member_count,
    startMonth: row.start_month,
    reminderEnabled: row.reminder_enabled === 1,
    lastRemindedMonth: row.last_reminded_month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTontineGroup(db: SqlDatabase, input: NewTontineGroup): Promise<TontineGroup> {
  const id = generateId();
  const now = new Date().toISOString();
  const reminderEnabled = input.reminderEnabled ?? false;
  await db.runAsync(
    `INSERT INTO tontine_groups (id, name, contribution_per_round_minor, currency_code, member_count, start_month, reminder_enabled, last_reminded_month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.name,
      input.contributionPerRoundMinor,
      input.currencyCode,
      input.memberCount,
      input.startMonth,
      reminderEnabled ? 1 : 0,
      null,
      now,
      now,
    ],
  );
  return {
    id,
    name: input.name,
    contributionPerRoundMinor: input.contributionPerRoundMinor,
    currencyCode: input.currencyCode,
    memberCount: input.memberCount,
    startMonth: input.startMonth,
    reminderEnabled,
    lastRemindedMonth: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTontineGroupById(db: SqlDatabase, id: string): Promise<TontineGroup | null> {
  const row = await db.getFirstAsync<TontineGroupRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_groups WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTontineGroups(db: SqlDatabase): Promise<TontineGroup[]> {
  const rows = await db.getAllAsync<TontineGroupRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_groups ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateTontineGroup(
  db: SqlDatabase,
  id: string,
  patch: TontineGroupPatch,
): Promise<TontineGroup> {
  const existing = await getTontineGroupById(db, id);
  if (!existing) {
    throw new NotFoundError('TontineGroup', id);
  }
  const updated: TontineGroup = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE tontine_groups SET name = ?, contribution_per_round_minor = ?, reminder_enabled = ?, last_reminded_month = ?, updated_at = ? WHERE id = ?;',
    [
      updated.name,
      updated.contributionPerRoundMinor,
      updated.reminderEnabled ? 1 : 0,
      updated.lastRemindedMonth,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}
