import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type {
  DiasporaBeneficiary,
  DiasporaBeneficiaryFrequency,
  DiasporaBeneficiaryPatch,
  NewDiasporaBeneficiary,
} from './types';

interface DiasporaBeneficiaryRow {
  id: string;
  name: string;
  relationship: string;
  usual_amount_minor: number | null;
  frequency: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id, name, relationship, usual_amount_minor, frequency, created_at, updated_at';

function fromRow(row: DiasporaBeneficiaryRow): DiasporaBeneficiary {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    usualAmountMinor: row.usual_amount_minor,
    frequency: row.frequency as DiasporaBeneficiaryFrequency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDiasporaBeneficiary(
  db: SqlDatabase,
  input: NewDiasporaBeneficiary,
): Promise<DiasporaBeneficiary> {
  const id = generateId();
  const now = new Date().toISOString();
  const usualAmountMinor = input.usualAmountMinor ?? null;
  await db.runAsync(
    `INSERT INTO diaspora_beneficiaries (id, name, relationship, usual_amount_minor, frequency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.name, input.relationship, usualAmountMinor, input.frequency, now, now],
  );
  return {
    id,
    name: input.name,
    relationship: input.relationship,
    usualAmountMinor,
    frequency: input.frequency,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getDiasporaBeneficiaryById(
  db: SqlDatabase,
  id: string,
): Promise<DiasporaBeneficiary | null> {
  const row = await db.getFirstAsync<DiasporaBeneficiaryRow>(
    `SELECT ${SELECT_COLUMNS} FROM diaspora_beneficiaries WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

/** Ordered by creation, like `listVaults` — the oldest (first-added) beneficiary listed first. */
export async function listDiasporaBeneficiaries(db: SqlDatabase): Promise<DiasporaBeneficiary[]> {
  const rows = await db.getAllAsync<DiasporaBeneficiaryRow>(
    `SELECT ${SELECT_COLUMNS} FROM diaspora_beneficiaries ORDER BY created_at ASC;`,
  );
  return rows.map(fromRow);
}

export async function updateDiasporaBeneficiary(
  db: SqlDatabase,
  id: string,
  patch: DiasporaBeneficiaryPatch,
): Promise<DiasporaBeneficiary> {
  const existing = await getDiasporaBeneficiaryById(db, id);
  if (!existing) {
    throw new NotFoundError('DiasporaBeneficiary', id);
  }
  const updated: DiasporaBeneficiary = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync(
    'UPDATE diaspora_beneficiaries SET name = ?, relationship = ?, usual_amount_minor = ?, frequency = ?, updated_at = ? WHERE id = ?;',
    [
      updated.name,
      updated.relationship,
      updated.usualAmountMinor,
      updated.frequency,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

/** Deleting a beneficiary never touches `diaspora_transfers` — past transfers keep their row, only
 *  their `beneficiary_id` now points at nothing (US-046's "sans perdre l'historique"). */
export async function deleteDiasporaBeneficiary(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM diaspora_beneficiaries WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('DiasporaBeneficiary', id);
  }
}
