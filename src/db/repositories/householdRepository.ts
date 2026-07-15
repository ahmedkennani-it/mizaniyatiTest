import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { Household, HouseholdPatch, NewHousehold } from './types';

interface HouseholdRow {
  id: string;
  name: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, name, currency_code, created_at, updated_at';

function fromRow(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    currencyCode: row.currency_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createHousehold(db: SqlDatabase, input: NewHousehold): Promise<Household> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO households (id, name, currency_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?);`,
    [id, input.name, input.currencyCode, now, now],
  );
  return {
    id,
    name: input.name,
    currencyCode: input.currencyCode,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getHouseholdById(db: SqlDatabase, id: string): Promise<Household | null> {
  const row = await db.getFirstAsync<HouseholdRow>(
    `SELECT ${SELECT_COLUMNS} FROM households WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listHouseholds(db: SqlDatabase): Promise<Household[]> {
  const rows = await db.getAllAsync<HouseholdRow>(
    `SELECT ${SELECT_COLUMNS} FROM households ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateHousehold(
  db: SqlDatabase,
  id: string,
  patch: HouseholdPatch,
): Promise<Household> {
  const existing = await getHouseholdById(db, id);
  if (!existing) {
    throw new NotFoundError('Household', id);
  }
  const updated: Household = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE households SET name = ?, currency_code = ?, updated_at = ? WHERE id = ?;',
    [updated.name, updated.currencyCode, updated.updatedAt, id],
  );
  return updated;
}

export async function deleteHousehold(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM households WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Household', id);
  }
}
