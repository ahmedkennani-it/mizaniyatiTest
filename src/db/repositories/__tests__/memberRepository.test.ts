import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  createMember,
  deleteMember,
  getMemberById,
  listMembers,
  updateMember,
} from '../memberRepository';

describe('memberRepository', () => {
  it('creates a member and reads it back', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    expect(member.id).toEqual(expect.any(String));
    expect(member.name).toBe('Salma');
    expect(await getMemberById(db, member.id)).toEqual(member);
  });

  it('defaults role to editor', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    expect(member.role).toBe('editor');
  });

  it('accepts an explicit role', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma', role: 'viewer' });

    expect(member.role).toBe('viewer');
  });

  it('updates a member role', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    const updated = await updateMember(db, member.id, { role: 'viewer' });

    expect(updated.role).toBe('viewer');
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getMemberById(db, 'missing')).toBeNull();
  });

  it('lists members ordered by name', async () => {
    const { db } = createFakeDatabase();
    await createMember(db, { name: 'Youssef' });
    await createMember(db, { name: 'Amina' });

    const members = await listMembers(db);
    expect(members.map((m) => m.name)).toEqual(['Amina', 'Youssef']);
  });

  it('updates a member and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    const updated = await updateMember(db, member.id, { name: 'Salma B.' });

    expect(updated.name).toBe('Salma B.');
    expect(await getMemberById(db, member.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown member', async () => {
    const { db } = createFakeDatabase();
    await expect(updateMember(db, 'missing', { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('deletes a member', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    await deleteMember(db, member.id);

    expect(await getMemberById(db, member.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown member', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteMember(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
