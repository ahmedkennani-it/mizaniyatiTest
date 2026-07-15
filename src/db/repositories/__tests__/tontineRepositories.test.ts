import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  createTontineGroup,
  getTontineGroupById,
  listTontineGroups,
  updateTontineGroup,
} from '../tontineGroupRepository';
import {
  createTontineMember,
  getTontineMemberById,
  listTontineMembers,
} from '../tontineMemberRepository';
import {
  createTontineRound,
  getTontineRoundById,
  listTontineRounds,
} from '../tontineRoundRepository';
import {
  createTontinePayment,
  getTontinePaymentById,
  listTontinePayments,
  updateTontinePayment,
} from '../tontinePaymentRepository';

async function seedGroupAndMember(db: ReturnType<typeof createFakeDatabase>['db']) {
  const group = await createTontineGroup(db, {
    name: 'Tontine famille',
    contributionPerRoundMinor: 100000,
    currencyCode: 'MAD',
    memberCount: 4,
    startMonth: '2026-07',
  });
  const member = await createTontineMember(db, {
    groupId: group.id,
    name: 'Youssef',
    roundOrder: 1,
    isSelf: true,
  });
  return { group, member };
}

describe('tontineGroupRepository', () => {
  it('creates a group and reads it back', async () => {
    const { db } = createFakeDatabase();

    const group = await createTontineGroup(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      memberCount: 4,
      startMonth: '2026-07',
    });

    expect(group.id).toEqual(expect.any(String));
    expect(group.reminderEnabled).toBe(false);
    expect(await getTontineGroupById(db, group.id)).toEqual(group);
  });

  it('rejects a negative contribution (CHECK)', async () => {
    const { db } = createFakeDatabase();
    await expect(
      createTontineGroup(db, {
        name: 'Tontine',
        contributionPerRoundMinor: -100,
        currencyCode: 'MAD',
        memberCount: 4,
        startMonth: '2026-07',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists groups ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const first = await createTontineGroup(db, {
      name: 'A',
      contributionPerRoundMinor: 1000,
      currencyCode: 'MAD',
      memberCount: 2,
      startMonth: '2026-07',
    });
    const second = await createTontineGroup(db, {
      name: 'B',
      contributionPerRoundMinor: 2000,
      currencyCode: 'MAD',
      memberCount: 3,
      startMonth: '2026-07',
    });

    expect((await listTontineGroups(db)).map((g) => g.id)).toEqual([first.id, second.id]);
  });

  it('updates a group (e.g. reminder toggle)', async () => {
    const { db } = createFakeDatabase();
    const { group } = await seedGroupAndMember(db);

    const updated = await updateTontineGroup(db, group.id, { reminderEnabled: true });

    expect(updated.reminderEnabled).toBe(true);
    expect(await getTontineGroupById(db, group.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown group', async () => {
    const { db } = createFakeDatabase();
    await expect(updateTontineGroup(db, 'missing', { reminderEnabled: true })).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('tontineMemberRepository', () => {
  it('creates a member and reads it back', async () => {
    const { db } = createFakeDatabase();
    const { group } = await seedGroupAndMember(db);

    const member = await createTontineMember(db, {
      groupId: group.id,
      name: 'Salma',
      roundOrder: 2,
    });

    expect(member.isSelf).toBe(false);
    expect(await getTontineMemberById(db, member.id)).toEqual(member);
  });

  it('rejects an unknown group id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    await expect(
      createTontineMember(db, { groupId: 'missing-group', name: 'Salma', roundOrder: 1 }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('lists members ordered by roundOrder', async () => {
    const { db } = createFakeDatabase();
    const { group, member: first } = await seedGroupAndMember(db);
    const second = await createTontineMember(db, {
      groupId: group.id,
      name: 'Salma',
      roundOrder: 2,
    });

    expect((await listTontineMembers(db)).map((m) => m.id)).toEqual([first.id, second.id]);
  });
});

describe('tontineRoundRepository', () => {
  it('creates a round and reads it back', async () => {
    const { db } = createFakeDatabase();
    const { group, member } = await seedGroupAndMember(db);

    const round = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 1,
      month: '2026-07',
      beneficiaryMemberId: member.id,
    });

    expect(await getTontineRoundById(db, round.id)).toEqual(round);
  });

  it('rejects an unknown beneficiary id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const { group } = await seedGroupAndMember(db);

    await expect(
      createTontineRound(db, {
        groupId: group.id,
        roundNumber: 1,
        month: '2026-07',
        beneficiaryMemberId: 'missing',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('lists rounds ordered by roundNumber', async () => {
    const { db } = createFakeDatabase();
    const { group, member } = await seedGroupAndMember(db);
    const second = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 2,
      month: '2026-08',
      beneficiaryMemberId: member.id,
    });
    const first = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 1,
      month: '2026-07',
      beneficiaryMemberId: member.id,
    });

    expect((await listTontineRounds(db)).map((r) => r.id)).toEqual([first.id, second.id]);
  });
});

describe('tontinePaymentRepository', () => {
  it('creates a payment defaulting to pending', async () => {
    const { db } = createFakeDatabase();
    const { group, member } = await seedGroupAndMember(db);
    const round = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 1,
      month: '2026-07',
      beneficiaryMemberId: member.id,
    });

    const payment = await createTontinePayment(db, { roundId: round.id, memberId: member.id });

    expect(payment.status).toBe('pending');
    expect(payment.paidAt).toBeNull();
    expect(await getTontinePaymentById(db, payment.id)).toEqual(payment);
  });

  it('marks a payment paid', async () => {
    const { db } = createFakeDatabase();
    const { group, member } = await seedGroupAndMember(db);
    const round = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 1,
      month: '2026-07',
      beneficiaryMemberId: member.id,
    });
    const payment = await createTontinePayment(db, { roundId: round.id, memberId: member.id });

    const updated = await updateTontinePayment(db, payment.id, {
      status: 'paid',
      paidAt: '2026-07-05T10:00:00.000Z',
    });

    expect(updated.status).toBe('paid');
    expect(updated.paidAt).toBe('2026-07-05T10:00:00.000Z');
  });

  it('lists payments', async () => {
    const { db } = createFakeDatabase();
    const { group, member } = await seedGroupAndMember(db);
    const round = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: 1,
      month: '2026-07',
      beneficiaryMemberId: member.id,
    });
    await createTontinePayment(db, { roundId: round.id, memberId: member.id });

    expect(await listTontinePayments(db)).toHaveLength(1);
  });

  it('throws NotFoundError when updating an unknown payment', async () => {
    const { db } = createFakeDatabase();
    await expect(updateTontinePayment(db, 'missing', { status: 'paid' })).rejects.toThrow(
      NotFoundError,
    );
  });
});
