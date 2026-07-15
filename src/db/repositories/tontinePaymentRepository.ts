import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewTontinePayment, TontinePayment, TontinePaymentPatch, TontinePaymentStatus } from './types';

interface TontinePaymentRow {
  id: string;
  round_id: string;
  member_id: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, round_id, member_id, status, paid_at, created_at, updated_at';

function fromRow(row: TontinePaymentRow): TontinePayment {
  return {
    id: row.id,
    roundId: row.round_id,
    memberId: row.member_id,
    status: row.status as TontinePaymentStatus,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTontinePayment(
  db: SqlDatabase,
  input: NewTontinePayment,
): Promise<TontinePayment> {
  const id = generateId();
  const now = new Date().toISOString();
  const status = input.status ?? 'pending';
  await db.runAsync(
    `INSERT INTO tontine_payments (id, round_id, member_id, status, paid_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.roundId, input.memberId, status, null, now, now],
  );
  return {
    id,
    roundId: input.roundId,
    memberId: input.memberId,
    status,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTontinePaymentById(db: SqlDatabase, id: string): Promise<TontinePayment | null> {
  const row = await db.getFirstAsync<TontinePaymentRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_payments WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTontinePayments(db: SqlDatabase): Promise<TontinePayment[]> {
  const rows = await db.getAllAsync<TontinePaymentRow>(
    `SELECT ${SELECT_COLUMNS} FROM tontine_payments ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateTontinePayment(
  db: SqlDatabase,
  id: string,
  patch: TontinePaymentPatch,
): Promise<TontinePayment> {
  const existing = await getTontinePaymentById(db, id);
  if (!existing) {
    throw new NotFoundError('TontinePayment', id);
  }
  const updated: TontinePayment = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE tontine_payments SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?;',
    [updated.status, updated.paidAt, updated.updatedAt, id],
  );
  return updated;
}
