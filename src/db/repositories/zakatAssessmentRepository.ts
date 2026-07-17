import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewZakatAssessment, ZakatAssessment, ZakatAssessmentPaidPatch } from './types';

interface ZakatAssessmentRow {
  id: string;
  cash_minor: number;
  gold_silver_minor: number;
  investments_minor: number;
  debts_minor: number;
  base_minor: number;
  due_minor: number;
  above_nisab: number;
  due_date: string | null;
  paid_at: string | null;
  transaction_id: string | null;
  reminded_at: string | null;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, cash_minor, gold_silver_minor, investments_minor, debts_minor, base_minor, due_minor, above_nisab, due_date, paid_at, transaction_id, reminded_at, created_at';

function fromRow(row: ZakatAssessmentRow): ZakatAssessment {
  return {
    id: row.id,
    cashMinor: row.cash_minor,
    goldSilverMinor: row.gold_silver_minor,
    investmentsMinor: row.investments_minor,
    debtsMinor: row.debts_minor,
    baseMinor: row.base_minor,
    dueMinor: row.due_minor,
    aboveNisab: row.above_nisab === 1,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    transactionId: row.transaction_id,
    remindedAt: row.reminded_at,
    createdAt: row.created_at,
  };
}

export async function createZakatAssessment(
  db: SqlDatabase,
  input: NewZakatAssessment,
): Promise<ZakatAssessment> {
  const id = generateId();
  const now = new Date().toISOString();
  const dueDate = input.dueDate ?? null;
  await db.runAsync(
    `INSERT INTO zakat_assessments (id, cash_minor, gold_silver_minor, investments_minor, debts_minor, base_minor, due_minor, above_nisab, due_date, paid_at, transaction_id, reminded_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.cashMinor,
      input.goldSilverMinor,
      input.investmentsMinor,
      input.debtsMinor,
      input.baseMinor,
      input.dueMinor,
      input.aboveNisab ? 1 : 0,
      dueDate,
      null,
      null,
      null,
      now,
    ],
  );
  return {
    id,
    cashMinor: input.cashMinor,
    goldSilverMinor: input.goldSilverMinor,
    investmentsMinor: input.investmentsMinor,
    debtsMinor: input.debtsMinor,
    baseMinor: input.baseMinor,
    dueMinor: input.dueMinor,
    aboveNisab: input.aboveNisab,
    dueDate,
    paidAt: null,
    transactionId: null,
    remindedAt: null,
    createdAt: now,
  };
}

export async function getZakatAssessmentById(
  db: SqlDatabase,
  id: string,
): Promise<ZakatAssessment | null> {
  const row = await db.getFirstAsync<ZakatAssessmentRow>(
    `SELECT ${SELECT_COLUMNS} FROM zakat_assessments WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listZakatAssessments(db: SqlDatabase): Promise<ZakatAssessment[]> {
  const rows = await db.getAllAsync<ZakatAssessmentRow>(
    `SELECT ${SELECT_COLUMNS} FROM zakat_assessments ORDER BY created_at DESC;`,
  );
  return rows.map(fromRow);
}

/** Marks a planned Zakat as paid, linking the expense `Transaction` created for it (US-043). */
export async function markZakatAssessmentPaid(
  db: SqlDatabase,
  id: string,
  patch: ZakatAssessmentPaidPatch,
): Promise<ZakatAssessment> {
  const existing = await getZakatAssessmentById(db, id);
  if (!existing) {
    throw new NotFoundError('ZakatAssessment', id);
  }
  const updated: ZakatAssessment = {
    ...existing,
    paidAt: patch.paidAt,
    transactionId: patch.transactionId,
  };
  await db.runAsync(
    'UPDATE zakat_assessments SET paid_at = ?, transaction_id = ? WHERE id = ?;',
    [updated.paidAt, updated.transactionId, id],
  );
  return updated;
}

/** Marks that the due-date reminder has fired, so `processZakatReminders` never repeats it. */
export async function markZakatAssessmentReminded(
  db: SqlDatabase,
  id: string,
  remindedAt = new Date().toISOString(),
): Promise<ZakatAssessment> {
  const existing = await getZakatAssessmentById(db, id);
  if (!existing) {
    throw new NotFoundError('ZakatAssessment', id);
  }
  const updated: ZakatAssessment = { ...existing, remindedAt };
  await db.runAsync('UPDATE zakat_assessments SET reminded_at = ? WHERE id = ?;', [remindedAt, id]);
  return updated;
}
