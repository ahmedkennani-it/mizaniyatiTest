import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { NewTontineRound, TontineRound } from './types';

interface TontineRoundRow {
  id: string;
  group_id: string;
  round_number: number;
  month: string;
  beneficiary_member_id: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, group_id, round_number, month, beneficiary_member_id, created_at, updated_at';

function fromRow(row: TontineRoundRow): TontineRound {
  return {
    id: row.id,
    groupId: row.group_id,
    roundNumber: row.round_number,
    month: row.month,
    beneficiaryMemberId: row.beneficiary_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTontineRound(
  db: SqlDatabase,
  input: NewTontineRound,
): Promise<TontineRound> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO tontine_rounds (id, group_id, round_number, month, beneficiary_member_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.groupId, input.roundNumber, input.month, input.beneficiaryMemberId, now, now],
  );
  return {
    id,
    groupId: input.groupId,
    roundNumber: input.roundNumber,
    month: input.month,
    beneficiaryMemberId: input.beneficiaryMemberId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTontineRoundById(
  db: SqlDatabase,
  id: string,
): Promise<TontineRound | null> {
  const row = await db.getFirstAsync<TontineRoundRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_rounds WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTontineRounds(db: SqlDatabase): Promise<TontineRound[]> {
  const rows = await db.getAllAsync<TontineRoundRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_rounds ORDER BY round_number ASC;`,
  );
  return rows.map(fromRow);
}
