import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewTransfer, Transfer, TransferPatch } from './types';

interface TransferRow {
  id: string;
  amount_minor: number;
  currency_code: string;
  from_member_id: string;
  to_member_id: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, amount_minor, currency_code, from_member_id, to_member_id, date, note, created_at, updated_at';

function fromRow(row: TransferRow): Transfer {
  return {
    id: row.id,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    fromMemberId: row.from_member_id,
    toMemberId: row.to_member_id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTransfer(db: SqlDatabase, input: NewTransfer): Promise<Transfer> {
  const id = generateId();
  const now = new Date().toISOString();
  const note = input.note ?? null;
  await db.runAsync(
    `INSERT INTO transfers (id, amount_minor, currency_code, from_member_id, to_member_id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.amountMinor,
      input.currencyCode,
      input.fromMemberId,
      input.toMemberId,
      input.date,
      note,
      now,
      now,
    ],
  );
  return {
    id,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode,
    fromMemberId: input.fromMemberId,
    toMemberId: input.toMemberId,
    date: input.date,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTransferById(db: SqlDatabase, id: string): Promise<Transfer | null> {
  const row = await db.getFirstAsync<TransferRow>(
    `SELECT ${SELECT_COLUMNS} FROM transfers WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTransfers(db: SqlDatabase): Promise<Transfer[]> {
  const rows = await db.getAllAsync<TransferRow>(
    `SELECT ${SELECT_COLUMNS} FROM transfers ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateTransfer(
  db: SqlDatabase,
  id: string,
  patch: TransferPatch,
): Promise<Transfer> {
  const existing = await getTransferById(db, id);
  if (!existing) {
    throw new NotFoundError('Transfer', id);
  }
  const updated: Transfer = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE transfers SET amount_minor = ?, currency_code = ?, from_member_id = ?, to_member_id = ?, date = ?, note = ?, updated_at = ? WHERE id = ?;',
    [
      updated.amountMinor,
      updated.currencyCode,
      updated.fromMemberId,
      updated.toMemberId,
      updated.date,
      updated.note,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteTransfer(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM transfers WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Transfer', id);
  }
}
