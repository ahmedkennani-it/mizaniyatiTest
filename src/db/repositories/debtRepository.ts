import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { Debt, DebtPatch, NewDebt } from './types';

interface DebtRow {
  id: string;
  label: string;
  counterparty: string;
  direction: Debt['direction'];
  amount_minor: number;
  currency_code: string;
  due_date: string | null;
  settled: number;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, label, counterparty, direction, amount_minor, currency_code, due_date, settled, created_at, updated_at';

function fromRow(row: DebtRow): Debt {
  return {
    id: row.id,
    label: row.label,
    counterparty: row.counterparty,
    direction: row.direction,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    dueDate: row.due_date,
    settled: row.settled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDebt(db: SqlDatabase, input: NewDebt): Promise<Debt> {
  const id = generateId();
  const now = new Date().toISOString();
  const dueDate = input.dueDate ?? null;
  const settled = input.settled ?? false;
  await db.runAsync(
    `INSERT INTO debts (id, label, counterparty, direction, amount_minor, currency_code, due_date, settled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.label,
      input.counterparty,
      input.direction,
      input.amountMinor,
      input.currencyCode,
      dueDate,
      settled ? 1 : 0,
      now,
      now,
    ],
  );
  return {
    id,
    label: input.label,
    counterparty: input.counterparty,
    direction: input.direction,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode,
    dueDate,
    settled,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getDebtById(db: SqlDatabase, id: string): Promise<Debt | null> {
  const row = await db.getFirstAsync<DebtRow>(
    `SELECT ${SELECT_COLUMNS} FROM debts WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listDebts(db: SqlDatabase): Promise<Debt[]> {
  const rows = await db.getAllAsync<DebtRow>(
    `SELECT ${SELECT_COLUMNS} FROM debts ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateDebt(db: SqlDatabase, id: string, patch: DebtPatch): Promise<Debt> {
  const existing = await getDebtById(db, id);
  if (!existing) {
    throw new NotFoundError('Debt', id);
  }
  const updated: Debt = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE debts SET label = ?, counterparty = ?, direction = ?, amount_minor = ?, currency_code = ?, due_date = ?, settled = ?, updated_at = ? WHERE id = ?;',
    [
      updated.label,
      updated.counterparty,
      updated.direction,
      updated.amountMinor,
      updated.currencyCode,
      updated.dueDate,
      updated.settled ? 1 : 0,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteDebt(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM debts WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Debt', id);
  }
}
