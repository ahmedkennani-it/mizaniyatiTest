import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { NewVaultContribution, VaultContribution } from './types';

interface VaultContributionRow {
  id: string;
  vault_id: string;
  amount_minor: number;
  member_id: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, vault_id, amount_minor, member_id, date, note, created_at, updated_at';

function fromRow(row: VaultContributionRow): VaultContribution {
  return {
    id: row.id,
    vaultId: row.vault_id,
    amountMinor: row.amount_minor,
    memberId: row.member_id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVaultContribution(
  db: SqlDatabase,
  input: NewVaultContribution,
): Promise<VaultContribution> {
  const id = generateId();
  const now = new Date().toISOString();
  const note = input.note ?? null;
  await db.runAsync(
    `INSERT INTO vault_contributions (id, vault_id, amount_minor, member_id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, input.vaultId, input.amountMinor, input.memberId, input.date, note, now, now],
  );
  return {
    id,
    vaultId: input.vaultId,
    amountMinor: input.amountMinor,
    memberId: input.memberId,
    date: input.date,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getVaultContributionById(
  db: SqlDatabase,
  id: string,
): Promise<VaultContribution | null> {
  const row = await db.getFirstAsync<VaultContributionRow>(
    `SELECT ${SELECT_COLUMNS} FROM vault_contributions WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function listVaultContributions(db: SqlDatabase): Promise<VaultContribution[]> {
  const rows = await db.getAllAsync<VaultContributionRow>(
    `SELECT ${SELECT_COLUMNS} FROM vault_contributions ORDER BY date DESC;`,
  );
  return rows.map(fromRow);
}

export async function deleteVaultContribution(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM vault_contributions WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('VaultContribution', id);
  }
}
