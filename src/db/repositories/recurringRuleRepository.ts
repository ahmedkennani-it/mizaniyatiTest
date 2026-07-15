import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type {
  NewRecurringRule,
  RecurringFrequency,
  RecurringMode,
  RecurringRule,
  RecurringRulePatch,
  TransactionType,
} from './types';

interface RecurringRuleRow {
  id: string;
  type: string;
  amount_minor: number;
  currency_code: string;
  category_id: string;
  member_id: string;
  frequency: string;
  day_of_month: number | null;
  weekday: number | null;
  start_date: string;
  end_date: string | null;
  mode: string;
  paused: number;
  last_run_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, type, amount_minor, currency_code, category_id, member_id, frequency, day_of_month, weekday, start_date, end_date, mode, paused, last_run_date, note, created_at, updated_at';

function fromRow(row: RecurringRuleRow): RecurringRule {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    categoryId: row.category_id,
    memberId: row.member_id,
    frequency: row.frequency as RecurringFrequency,
    dayOfMonth: row.day_of_month,
    weekday: row.weekday,
    startDate: row.start_date,
    endDate: row.end_date,
    mode: row.mode as RecurringMode,
    paused: row.paused === 1,
    lastRunDate: row.last_run_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRecurringRule(
  db: SqlDatabase,
  input: NewRecurringRule,
): Promise<RecurringRule> {
  const id = generateId();
  const now = new Date().toISOString();
  const dayOfMonth = input.dayOfMonth ?? null;
  const weekday = input.weekday ?? null;
  const endDate = input.endDate ?? null;
  const paused = input.paused ?? false;
  const note = input.note ?? null;
  await db.runAsync(
    `INSERT INTO recurring_rules (id, type, amount_minor, currency_code, category_id, member_id, frequency, day_of_month, weekday, start_date, end_date, mode, paused, last_run_date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      input.amountMinor,
      input.currencyCode,
      input.categoryId,
      input.memberId,
      input.frequency,
      dayOfMonth,
      weekday,
      input.startDate,
      endDate,
      input.mode,
      paused ? 1 : 0,
      null,
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
    frequency: input.frequency,
    dayOfMonth,
    weekday,
    startDate: input.startDate,
    endDate,
    mode: input.mode,
    paused,
    lastRunDate: null,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getRecurringRuleById(
  db: SqlDatabase,
  id: string,
): Promise<RecurringRule | null> {
  const row = await db.getFirstAsync<RecurringRuleRow>(
    `SELECT ${SELECT_COLUMNS} FROM recurring_rules WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listRecurringRules(db: SqlDatabase): Promise<RecurringRule[]> {
  const rows = await db.getAllAsync<RecurringRuleRow>(
    `SELECT ${SELECT_COLUMNS} FROM recurring_rules ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateRecurringRule(
  db: SqlDatabase,
  id: string,
  patch: RecurringRulePatch,
): Promise<RecurringRule> {
  const existing = await getRecurringRuleById(db, id);
  if (!existing) {
    throw new NotFoundError('RecurringRule', id);
  }
  const updated: RecurringRule = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    `UPDATE recurring_rules SET type = ?, amount_minor = ?, currency_code = ?, category_id = ?, member_id = ?, frequency = ?, day_of_month = ?, weekday = ?, start_date = ?, end_date = ?, mode = ?, paused = ?, last_run_date = ?, note = ?, updated_at = ? WHERE id = ?;`,
    [
      updated.type,
      updated.amountMinor,
      updated.currencyCode,
      updated.categoryId,
      updated.memberId,
      updated.frequency,
      updated.dayOfMonth,
      updated.weekday,
      updated.startDate,
      updated.endDate,
      updated.mode,
      updated.paused ? 1 : 0,
      updated.lastRunDate,
      updated.note,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteRecurringRule(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM recurring_rules WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('RecurringRule', id);
  }
}
