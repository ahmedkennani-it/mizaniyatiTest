import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { DiasporaTransfer, DiasporaTransferMethod, NewDiasporaTransfer } from './types';

interface DiasporaTransferRow {
  id: string;
  amount_minor: number;
  currency_code: string;
  occurred_at: string;
  beneficiary_id: string | null;
  method: string;
  origin_amount_minor: number | null;
  rate_is_manual: number;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, amount_minor, currency_code, occurred_at, beneficiary_id, method, origin_amount_minor, rate_is_manual, created_at';

function fromRow(row: DiasporaTransferRow): DiasporaTransfer {
  return {
    id: row.id,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    beneficiaryId: row.beneficiary_id,
    method: row.method as DiasporaTransferMethod,
    originAmountMinor: row.origin_amount_minor,
    rateIsManual: row.rate_is_manual === 1,
    createdAt: row.created_at,
  };
}

export async function createDiasporaTransfer(
  db: SqlDatabase,
  input: NewDiasporaTransfer,
): Promise<DiasporaTransfer> {
  const id = generateId();
  const now = new Date().toISOString();
  const beneficiaryId = input.beneficiaryId ?? null;
  const method = input.method ?? 'other';
  const originAmountMinor = input.originAmountMinor ?? null;
  const rateIsManual = input.rateIsManual ?? false;
  await db.runAsync(
    `INSERT INTO diaspora_transfers (id, amount_minor, currency_code, occurred_at, beneficiary_id, method, origin_amount_minor, rate_is_manual, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.amountMinor,
      input.currencyCode,
      input.occurredAt,
      beneficiaryId,
      method,
      originAmountMinor,
      rateIsManual ? 1 : 0,
      now,
    ],
  );
  return {
    id,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode,
    occurredAt: input.occurredAt,
    beneficiaryId,
    method,
    originAmountMinor,
    rateIsManual,
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
