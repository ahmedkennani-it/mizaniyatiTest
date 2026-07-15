import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewVault, Vault, VaultPatch } from './types';

interface VaultRow {
  id: string;
  name: string;
  target_minor: number;
  currency_code: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, name, target_minor, currency_code, deadline, created_at, updated_at';

function fromRow(row: VaultRow): Vault {
  return {
    id: row.id,
    name: row.name,
    targetMinor: row.target_minor,
    currencyCode: row.currency_code,
    deadline: row.deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVault(db: SqlDatabase, input: NewVault): Promise<Vault> {
  const id = generateId();
  const now = new Date().toISOString();
  const deadline = input.deadline ?? null;
  await db.runAsync(
    `INSERT INTO vaults (id, name, target_minor, currency_code, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.name, input.targetMinor, input.currencyCode, deadline, now, now],
  );
  return {
    id,
    name: input.name,
    targetMinor: input.targetMinor,
    currencyCode: input.currencyCode,
    deadline,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getVaultById(db: SqlDatabase, id: string): Promise<Vault | null> {
  const row = await db.getFirstAsync<VaultRow>(
    `SELECT ${SELECT_COLUMNS} FROM vaults WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listVaults(db: SqlDatabase): Promise<Vault[]> {
  const rows = await db.getAllAsync<VaultRow>(
    `SELECT ${SELECT_COLUMNS} FROM vaults ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateVault(db: SqlDatabase, id: string, patch: VaultPatch): Promise<Vault> {
  const existing = await getVaultById(db, id);
  if (!existing) {
    throw new NotFoundError('Vault', id);
  }
  const updated: Vault = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE vaults SET name = ?, target_minor = ?, currency_code = ?, deadline = ?, updated_at = ? WHERE id = ?;',
    [
      updated.name,
      updated.targetMinor,
      updated.currencyCode,
      updated.deadline,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteVault(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM vaults WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Vault', id);
  }
}
