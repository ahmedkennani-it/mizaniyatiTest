import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { DiasporaTransfer, NewDiasporaTransfer } from './types';

interface DiasporaTransferRow {
  id: string;
  amount_minor: number;
  currency_code: string;
  occurred_at: string;
  created_at: string;
}

const SELECT_COLUMNS = 'id, amount_minor, currency_code, occurred_at, created_at';

function fromRow(row: DiasporaTransferRow): DiasporaTransfer {
  return {
    id: row.id,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export async function createDiasporaTransfer(
  db: SqlDatabase,
  input: NewDiasporaTransfer,
): Promise<DiasporaTransfer> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO diaspora_transfers (id, amount_minor, currency_code, occurred_at, created_at) VALUES (?, ?, ?, ?, ?);`,
    [id, input.amountMinor, input.currencyCode, input.occurredAt, now],
  );
  return {
    id,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode,
    occurredAt: input.occurredAt,
    createdAt: now,
  };
}

/** All transfers, newest first — callers group/sum by year themselves (`computeAnnualTransferSummary`). */
export async function listDiasporaTransfers(db: SqlDatabase): Promise<DiasporaTransfer[]> {
  const rows = await db.getAllAsync<DiasporaTransferRow>(
    `SELECT ${SELECT_COLUMNS} FROM diaspora_transfers ORDER BY occurred_at DESC;`,
  );
  return rows.map(fromRow);
}
