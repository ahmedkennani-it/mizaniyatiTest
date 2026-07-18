import { generateId } from '../id';
import type { SqlDatabase } from '../types';
import { NotFoundError } from './errors';
import type { Member, MemberPatch, MemberRole, NewMember } from './types';

interface MemberRow {
  id: string;
  name: string;
  role: string;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'id, name, role, removed_at, created_at, updated_at';

function fromRow(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    role: row.role as MemberRole,
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMember(db: SqlDatabase, input: NewMember): Promise<Member> {
  const id = generateId();
  const now = new Date().toISOString();
  const role = input.role ?? 'editor';
  await db.runAsync(
    'INSERT INTO members (id, name, role, removed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
    [id, input.name, role, null, now, now],
  );
  return { id, name: input.name, role, removedAt: null, createdAt: now, updatedAt: now };
}

export async function getMemberById(db: SqlDatabase, id: string): Promise<Member | null> {
  const row = await db.getFirstAsync<MemberRow>(
    `SELECT ${SELECT_COLUMNS} FROM members WHERE id = ?;`,
    [id],
  );
  return row ? fromRow(row) : null;
}

/** Every member, including a removed one — for resolving a past transaction's attribution
 *  (`Member.name`) in history views. Use `listMembers` for anything that picks *among currently
 *  active* members (a new transaction, a contribution, the member-management list). */
export async function listAllMembers(db: SqlDatabase): Promise<Member[]> {
  const rows = await db.getAllAsync<MemberRow>(
    `SELECT ${SELECT_COLUMNS} FROM members ORDER BY name ASC;`,
  );
  return rows.map(fromRow);
}

/** Active members only (`removedAt === null`) — the default for every member picker. */
export async function listMembers(db: SqlDatabase): Promise<Member[]> {
  const all = await listAllMembers(db);
  return all.filter((member) => member.removedAt === null);
}

export async function updateMember(
  db: SqlDatabase,
  id: string,
  patch: MemberPatch,
): Promise<Member> {
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

/**
 * "Retirer du foyer" (US-052) — soft delete. Never touches `transactions.member_id`: past
 * operations stay attributed to this member, they just fall out of `listMembers`'s active picker.
 */
export async function removeMember(
  db: SqlDatabase,
  id: string,
  removedAt = new Date().toISOString(),
): Promise<Member> {
  const existing = await getMemberById(db, id);
  if (!existing) {
    throw new NotFoundError('Member', id);
  }
  const updated: Member = { ...existing, removedAt };
  await db.runAsync('UPDATE members SET removed_at = ? WHERE id = ?;', [removedAt, id]);
  return updated;
}

export async function deleteMember(db: SqlDatabase, id: string): Promise<void> {
  const result = await db.runAsync('DELETE FROM members WHERE id = ?;', [id]);
  if (result.changes === 0) {
    throw new NotFoundError('Member', id);
  }
}
