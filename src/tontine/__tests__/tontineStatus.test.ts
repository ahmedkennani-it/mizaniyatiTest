import type { TontineMember, TontinePayment, TontineRound } from '../../db/repositories';
import { computeRoundStatus, findCurrentRound, findMyRound, monthsUntil } from '../tontineStatus';

function makeMember(overrides: Partial<TontineMember> = {}): TontineMember {
  return {
    id: 'member-1',
    groupId: 'group-1',
    name: 'Youssef',
    roundOrder: 1,
    isSelf: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRound(overrides: Partial<TontineRound> = {}): TontineRound {
  return {
    id: 'round-1',
    groupId: 'group-1',
    roundNumber: 1,
    month: '2026-07',
    beneficiaryMemberId: 'member-1',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePayment(overrides: Partial<TontinePayment> = {}): TontinePayment {
  return {
    id: 'payment-1',
    roundId: 'round-1',
    memberId: 'member-1',
    status: 'pending',
    paidAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeRoundStatus', () => {
  it('counts paid/total and finds the beneficiary', () => {
    const members = [
      makeMember({ id: 'm1', name: 'Youssef' }),
      makeMember({ id: 'm2', name: 'Salma' }),
      makeMember({ id: 'm3', name: 'Ahmed' }),
    ];
    const round = makeRound({ id: 'r1', beneficiaryMemberId: 'm2' });
    const payments = [
      makePayment({ roundId: 'r1', memberId: 'm1', status: 'paid' }),
      makePayment({ roundId: 'r1', memberId: 'm2', status: 'paid' }),
      makePayment({ roundId: 'r1', memberId: 'm3', status: 'pending' }),
    ];

    const status = computeRoundStatus(round, payments, members);

    expect(status.paidCount).toBe(2);
    expect(status.totalCount).toBe(3);
    expect(status.beneficiary?.name).toBe('Salma');
    expect(status.memberStatuses.map((s) => s.payment?.status)).toEqual([
      'paid',
      'paid',
      'pending',
    ]);
  });

  it('ignores payments belonging to a different round', () => {
    const members = [makeMember({ id: 'm1' })];
    const round = makeRound({ id: 'r1', beneficiaryMemberId: 'm1' });
    const payments = [makePayment({ roundId: 'other-round', memberId: 'm1', status: 'paid' })];

    const status = computeRoundStatus(round, payments, members);

    expect(status.paidCount).toBe(0);
    expect(status.memberStatuses[0].payment).toBeNull();
  });
});

describe('findCurrentRound', () => {
  const rounds = [
    makeRound({ id: 'r1', month: '2026-06' }),
    makeRound({ id: 'r2', month: '2026-07' }),
    makeRound({ id: 'r3', month: '2026-08' }),
  ];

  it('returns the round matching the current month', () => {
    expect(findCurrentRound(rounds, new Date('2026-07-15T00:00:00.000Z'))?.id).toBe('r2');
  });

  it('returns the next upcoming round when none match exactly', () => {
    expect(findCurrentRound(rounds, new Date('2026-05-20T00:00:00.000Z'))?.id).toBe('r1');
  });

  it('falls back to the last round once every round is in the past', () => {
    expect(findCurrentRound(rounds, new Date('2027-01-01T00:00:00.000Z'))?.id).toBe('r3');
  });

  it('returns null for an empty group', () => {
    expect(findCurrentRound([], new Date())).toBeNull();
  });
});

describe('findMyRound', () => {
  it('finds the round whose beneficiary is the self participant', () => {
    const members = [makeMember({ id: 'm1' }), makeMember({ id: 'm2', isSelf: true })];
    const rounds = [
      makeRound({ id: 'r1', beneficiaryMemberId: 'm1' }),
      makeRound({ id: 'r2', beneficiaryMemberId: 'm2' }),
    ];

    expect(findMyRound(rounds, members)?.id).toBe('r2');
  });

  it('returns null when no member is marked self', () => {
    const members = [makeMember({ id: 'm1' })];
    const rounds = [makeRound({ id: 'r1', beneficiaryMemberId: 'm1' })];

    expect(findMyRound(rounds, members)).toBeNull();
  });
});

describe('monthsUntil', () => {
  it('is positive for a future month', () => {
    expect(monthsUntil(new Date('2026-07-01T00:00:00.000Z'), '2027-01')).toBe(6);
  });

  it('is negative for a past month', () => {
    expect(monthsUntil(new Date('2026-07-01T00:00:00.000Z'), '2026-01')).toBe(-6);
  });

  it('is zero for the current month', () => {
    expect(monthsUntil(new Date('2026-07-15T00:00:00.000Z'), '2026-07')).toBe(0);
  });
});
