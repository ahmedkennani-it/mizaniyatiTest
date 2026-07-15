import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { Member, MemberPatch, MemberRole, NewMember } from './types';

interface MemberRow {
  id: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, name, role, created_at, updated_at';

function fromRow(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    role: row.role as MemberRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMember(db: SqlDatabase, input: NewMember): Promise<Member> {
  const id = generateId();
  const now = new Date().toISOString();
  const role = input.role ?? 'editor';
  await db.runAsync(
    'INSERT INTO members (id, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
    [id, input.name, role, now, now],
  );
  return { id, name: input.name, role, createdAt: now, updatedAt: now };
}

export async function getMemberById(db: SqlDatabase, id: string): Promise<Member | null> {
  const row = await db.getFirstAsync<MemberRow>(`SELECT ${SELECT_COLUMNS} FROM members WHERE id = ?;`, [
    id,
  ]);
  return row ? fromRow(row) : null;
}

export async function listMembers(db: SqlDatabase): Promise<Member[]> {
  const rows = await db.getAllAsync<MemberRow>(`SELECT ${SELECT_COLUMNS} FROM members ORDER BY name ASC;`);
  return rows.map(fromRow);
}

export async function updateMember(db: SqlDatabase, id: string, patch: MemberPatch): Promise<Member> {
  const existing = await getMemberById(db, id);
  if (!existing) {
    throw new NotFoundError('Member', id);
  }
  const updated: Member = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.runAsync('UPDATE members SET name = ?, role = ?, updated_at = ? WHERE id = ?;', [
    updated.name,
    updated.role,
    updated.updatedAt,
    id,
  ]);
  return updated;
}

export async function deleteMember(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM members WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Member', id);
  }
}
