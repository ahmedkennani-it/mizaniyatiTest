import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createTransaction } from '../transactionRepository';
import { createCategory } from '../categoryRepository';
import { NotFoundError } from '../errors';
import {
  createMember,
  deleteMember,
  getMemberById,
  listAllMembers,
  listMembers,
  removeMember,
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

  it('creates a member as active (removedAt null)', async () => {
    const { db } = createFakeDatabase();
    const member = await createMember(db, { name: 'Salma' });

    expect(member.removedAt).toBeNull();
  });

  describe('removeMember (US-052)', () => {
    it('soft-deletes a member: sets removedAt without deleting the row', async () => {
      const { db } = createFakeDatabase();
      const member = await createMember(db, { name: 'Salma' });

      const removed = await removeMember(db, member.id, '2026-07-01T00:00:00.000Z');

      expect(removed.removedAt).toBe('2026-07-01T00:00:00.000Z');
      expect(await getMemberById(db, member.id)).toEqual(removed);
    });

    it('throws NotFoundError when removing an unknown member', async () => {
      const { db } = createFakeDatabase();
      await expect(removeMember(db, 'missing')).rejects.toThrow(NotFoundError);
    });

    it('excludes a removed member from listMembers but keeps them in listAllMembers', async () => {
      const { db } = createFakeDatabase();
      const active = await createMember(db, { name: 'Amina' });
      const removedMember = await createMember(db, { name: 'Youssef' });
      await removeMember(db, removedMember.id);

      expect((await listMembers(db)).map((m) => m.id)).toEqual([active.id]);
      expect((await listAllMembers(db)).map((m) => m.id).sort()).toEqual(
        [active.id, removedMember.id].sort(),
      );
    });

    it("keeps a removed member's past transactions attributed to them", async () => {
      const { db } = createFakeDatabase();
      const member = await createMember(db, { name: 'Youssef' });
      const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#000000' });
      const transaction = await createTransaction(db, {
        type: 'expense',
        amountMinor: 1000,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-07-01T00:00:00.000Z',
      });

      await removeMember(db, member.id);

      const all = await listAllMembers(db);
      const resolved = all.find((m) => m.id === transaction.memberId);
      expect(resolved?.name).toBe('Youssef');
      expect(resolved?.removedAt).not.toBeNull();
    });
  });
});
