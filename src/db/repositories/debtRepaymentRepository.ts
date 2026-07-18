import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { DebtRepayment, NewDebtRepayment } from './types';

interface DebtRepaymentRow {
  id: string;
  debt_id: string;
  amount_minor: number;
  date: string;
  created_at: string;
}

const SELECT_COLUMNS = 'id, debt_id, amount_minor, date, created_at';

function fromRow(row: DebtRepaymentRow): DebtRepayment {
  return {
    id: row.id,
    debtId: row.debt_id,
    amountMinor: row.amount_minor,
    date: row.date,
    createdAt: row.created_at,
  };
}

export async function createDebtRepayment(
  db: SqlDatabase,
  input: NewDebtRepayment,
): Promise<DebtRepayment> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO debt_repayments (id, debt_id, amount_minor, date, created_at) VALUES (?, ?, ?, ?, ?);`,
    [id, input.debtId, input.amountMinor, input.date, now],
  );
  return {
    id,
    debtId: input.debtId,
    amountMinor: input.amountMinor,
    date: input.date,
    createdAt: now,
  };
}

/** All repayments, newest first — callers filter/sum by `debtId` themselves (`computeDebtStatus`). */
export async function listDebtRepayments(db: SqlDatabase): Promise<DebtRepayment[]> {
  const rows = await db.getAllAsync<DebtRepaymentRow>(
    `SELECT ${SELECT_COLUMNS} FROM debt_repayments ORDER BY date DESC;`,
  );
  return rows.map(fromRow);
}
