import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewSeasonalTheme, SeasonalTheme, SeasonalThemePatch, SeasonalThemeType } from './types';

interface SeasonalThemeRow {
  id: string;
  type: string;
  active: number;
  start_date: string;
  end_date: string;
  envelope_minor: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, type, active, start_date, end_date, envelope_minor, currency_code, created_at, updated_at';

function fromRow(row: SeasonalThemeRow): SeasonalTheme {
  return {
    id: row.id,
    type: row.type as SeasonalThemeType,
    active: row.active === 1,
    startDate: row.start_date,
    endDate: row.end_date,
    envelopeMinor: row.envelope_minor,
    currencyCode: row.currency_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSeasonalTheme(
  db: SqlDatabase,
  input: NewSeasonalTheme,
): Promise<SeasonalTheme> {
  const id = generateId();
  const now = new Date().toISOString();
  const active = input.active ?? true;
  await db.runAsync(
    `INSERT INTO seasonal_themes (id, type, active, start_date, end_date, envelope_minor, currency_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, input.type, active ? 1 : 0, input.startDate, input.endDate, input.envelopeMinor, input.currencyCode, now, now],
  );
  return {
    id,
    type: input.type,
    active,
    startDate: input.startDate,
    endDate: input.endDate,
    envelopeMinor: input.envelopeMinor,
    currencyCode: input.currencyCode,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSeasonalThemeById(db: SqlDatabase, id: string): Promise<SeasonalTheme | null> {
  const row = await db.getFirstAsync<SeasonalThemeRow>(
    `SELECT ${SELECT_COLUMNS} FROM seasonal_themes WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listSeasonalThemes(db: SqlDatabase): Promise<SeasonalTheme[]> {
  const rows = await db.getAllAsync<SeasonalThemeRow>(
    `SELECT ${SELECT_COLUMNS} FROM seasonal_themes ORDER BY created_at DESC;`,
  );
  return rows.map(fromRow);
}

export async function updateSeasonalTheme(
  db: SqlDatabase,
  id: string,
  patch: SeasonalThemePatch,
): Promise<SeasonalTheme> {
  const existing = await getSeasonalThemeById(db, id);
  if (!existing) {
    throw new NotFoundError('SeasonalTheme', id);
  }
  const updated: SeasonalTheme = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE seasonal_themes SET active = ?, start_date = ?, end_date = ?, envelope_minor = ?, updated_at = ? WHERE id = ?;',
    [updated.active ? 1 : 0, updated.startDate, updated.endDate, updated.envelopeMinor, updated.updatedAt, id],
  );
  return updated;
}
