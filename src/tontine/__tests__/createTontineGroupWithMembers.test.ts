import { listTontineMembers, listTontinePayments, listTontineRounds } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { createTontineGroupWithMembers } from '../createTontineGroupWithMembers';

describe('createTontineGroupWithMembers', () => {
  it('creates one member per name, in round order, marking the self participant', async () => {
    const { db } = createFakeDatabase();

    const { members } = await createTontineGroupWithMembers(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: '2026-07',
      memberNames: ['Youssef', 'Salma', 'Ahmed'],
      selfIndex: 1,
    });

    expect(members.map((m) => m.name)).toEqual(['Youssef', 'Salma', 'Ahmed']);
    expect(members.map((m) => m.roundOrder)).toEqual([1, 2, 3]);
    expect(members.map((m) => m.isSelf)).toEqual([false, true, false]);
  });

  it('derives memberCount from memberNames, so it always matches the number of rounds', async () => {
    const { db } = createFakeDatabase();

    const { group, rounds } = await createTontineGroupWithMembers(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: '2026-07',
      memberNames: ['Youssef', 'Salma', 'Ahmed'],
      selfIndex: 0,
    });

    expect(group.memberCount).toBe(3);
    expect(rounds).toHaveLength(3);
  });

  it('generates one round per member, months stepping forward from startMonth', async () => {
    const { db } = createFakeDatabase();

    const { rounds, members } = await createTontineGroupWithMembers(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: '2026-11',
      memberNames: ['Youssef', 'Salma', 'Ahmed'],
      selfIndex: 0,
    });

    expect(rounds.map((r) => r.month)).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(rounds.map((r) => r.beneficiaryMemberId)).toEqual(members.map((m) => m.id));
  });

  it('creates one pending payment per member per round', async () => {
    const { db } = createFakeDatabase();

    await createTontineGroupWithMembers(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: '2026-07',
      memberNames: ['Youssef', 'Salma', 'Ahmed'],
      selfIndex: 0,
    });

    const payments = await listTontinePayments(db);
    expect(payments).toHaveLength(9); // 3 members x 3 rounds
    expect(payments.every((p) => p.status === 'pending')).toBe(true);
  });

  it('persists members/rounds/payments retrievable via the repositories', async () => {
    const { db } = createFakeDatabase();

    await createTontineGroupWithMembers(db, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: '2026-07',
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    expect(await listTontineMembers(db)).toHaveLength(2);
    expect(await listTontineRounds(db)).toHaveLength(2);
  });
});
