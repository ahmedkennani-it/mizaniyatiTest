import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { NewTontineMember, TontineMember } from './types';

interface TontineMemberRow {
  id: string;
  group_id: string;
  name: string;
  round_order: number;
  is_self: number;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, group_id, name, round_order, is_self, created_at, updated_at';

function fromRow(row: TontineMemberRow): TontineMember {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    roundOrder: row.round_order,
    isSelf: row.is_self === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTontineMember(
  db: SqlDatabase,
  input: NewTontineMember,
): Promise<TontineMember> {
  const id = generateId();
  const now = new Date().toISOString();
  const isSelf = input.isSelf ?? false;
  await db.runAsync(
    `INSERT INTO tontine_members (id, group_id, name, round_order, is_self, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.groupId, input.name, input.roundOrder, isSelf ? 1 : 0, now, now],
  );
  return {
    id,
    groupId: input.groupId,
    name: input.name,
    roundOrder: input.roundOrder,
    isSelf,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTontineMemberById(
  db: SqlDatabase,
  id: string,
): Promise<TontineMember | null> {
  const row = await db.getFirstAsync<TontineMemberRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_members WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTontineMembers(db: SqlDatabase): Promise<TontineMember[]> {
  const rows = await db.getAllAsync<TontineMemberRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_members ORDER BY round_order ASC;`,
  );
  return rows.map(fromRow);
}
