import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import type { NewZakatAssessment, ZakatAssessment } from './types';

interface ZakatAssessmentRow {
  id: string;
  cash_minor: number;
  gold_silver_minor: number;
  investments_minor: number;
  debts_minor: number;
  base_minor: number;
  due_minor: number;
  above_nisab: number;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, cash_minor, gold_silver_minor, investments_minor, debts_minor, base_minor, due_minor, above_nisab, created_at';

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
    createdAt: row.created_at,
  };
}

export async function createZakatAssessment(
  db: SqlDatabase,
  input: NewZakatAssessment,
): Promise<ZakatAssessment> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO zakat_assessments (id, cash_minor, gold_silver_minor, investments_minor, debts_minor, base_minor, due_minor, above_nisab, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.cashMinor,
      input.goldSilverMinor,
      input.investmentsMinor,
      input.debtsMinor,
      input.baseMinor,
      input.dueMinor,
      input.aboveNisab ? 1 : 0,
      now,
    ],
  );
  return { id, ...input, createdAt: now };
}

export async function listZakatAssessments(db: SqlDatabase): Promise<ZakatAssessment[]> {
  const rows = await db.getAllAsync<ZakatAssessmentRow>(
    `SELECT ${SELECT_COLUMNS} FROM zakat_assessments ORDER BY created_at DESC;`,
  );
  return rows.map(fromRow);
}
