import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewTransaction, Transaction, TransactionPatch, TransactionType } from './types';

interface TransactionRow {
  id: string;
  type: string;
  amount_minor: number;
  currency_code: string;
  category_id: string;
  member_id: string;
  occurred_at: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, type, amount_minor, currency_code, category_id, member_id, occurred_at, note, created_at, updated_at';

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    categoryId: row.category_id,
    memberId: row.member_id,
    occurredAt: row.occurred_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTransaction(db: SqlDatabase, input: NewTransaction): Promise<Transaction> {
  const id = generateId();
  const now = new Date().toISOString();
  const note = input.note ?? null;
  await db.runAsync(
    `INSERT INTO transactions (id, type, amount_minor, currency_code, category_id, member_id, occurred_at, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      input.amountMinor,
      input.currencyCode,
      input.categoryId,
      input.memberId,
      input.occurredAt,
      note,
      now,
      now,
    ],
  );
  return {
    id,
    type: input.type,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode,
    categoryId: input.categoryId,
    memberId: input.memberId,
    occurredAt: input.occurredAt,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTransactionById(db: SqlDatabase, id: string): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    `SELECT ${SELECT_COLUMNS} FROM transactions WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listTransactions(db: SqlDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT ${SELECT_COLUMNS} FROM transactions ORDER BY occurred_at DESC;`,
  );
  return rows.map(fromRow);
}

export async function updateTransaction(
  db: SqlDatabase,
  id: string,
  patch: TransactionPatch,
): Promise<Transaction> {
  const existing = await getTransactionById(db, id);
  if (!existing) {
    throw new NotFoundError('Transaction', id);
  }
  const updated: Transaction = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    `UPDATE transactions SET type = ?, amount_minor = ?, currency_code = ?, category_id = ?, member_id = ?, occurred_at = ?, note = ?, updated_at = ? WHERE id = ?;`,
    [
      updated.type,
      updated.amountMinor,
      updated.currencyCode,
      updated.categoryId,
      updated.memberId,
      updated.occurredAt,
      updated.note,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteTransaction(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Transaction', id);
  }
}
