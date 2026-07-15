import {
  createTontineGroup,
  createTontineMember,
  createTontinePayment,
  createTontineRound,
} from '../db/repositories';
import type { TontineGroup, TontineMember, TontinePayment, TontineRound } from '../db/repositories';
import type { SqlDatabase } from '../db/types';

export interface CreateTontineGroupInput {
  name: string;
  contributionPerRoundMinor: number;
  currencyCode: string;
  /** ISO `YYYY-MM` — the month round 1 pays out. */
  startMonth: string;
  reminderEnabled?: boolean;
  /** In round order — `memberNames[0]` benefits from round 1, etc. Also fixes `memberCount`. */
  memberNames: string[];
  /** Index into `memberNames` identifying this household's own participant. */
  selfIndex: number;
}

function addMonths(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Creates a tontine group along with everything derived from its member order (US-024,
 * `docs/specs/tontine.md`): one round per member (a group with N members always has exactly N
 * rounds — "nombre de tours ≠ nombre de membres" can't happen since `memberCount` is derived from
 * `memberNames.length`, not taken as a separate caller-supplied number), and one pending payment
 * per member per round. This is the only way a group should be created — `createTontineGroup`
 * alone would leave it with no members/rounds/payments at all.
 */
export async function createTontineGroupWithMembers(
  db: SqlDatabase,
  input: CreateTontineGroupInput,
): Promise<{
  group: TontineGroup;
  members: TontineMember[];
  rounds: TontineRound[];
  payments: TontinePayment[];
}> {
  const group = await createTontineGroup(db, {
    name: input.name,
    contributionPerRoundMinor: input.contributionPerRoundMinor,
    currencyCode: input.currencyCode,
    memberCount: input.memberNames.length,
    startMonth: input.startMonth,
    reminderEnabled: input.reminderEnabled,
  });

  const members: TontineMember[] = [];
  for (const [index, name] of input.memberNames.entries()) {
    const member = await createTontineMember(db, {
      groupId: group.id,
      name,
      roundOrder: index + 1,
      isSelf: index === input.selfIndex,
    });
    members.push(member);
  }

  const rounds: TontineRound[] = [];
  for (const [index, member] of members.entries()) {
    const round = await createTontineRound(db, {
      groupId: group.id,
      roundNumber: index + 1,
      month: addMonths(input.startMonth, index),
      beneficiaryMemberId: member.id,
    });
    rounds.push(round);
  }

  const payments: TontinePayment[] = [];
  for (const round of rounds) {
    for (const member of members) {
      const payment = await createTontinePayment(db, { roundId: round.id, memberId: member.id });
      payments.push(payment);
    }
  }

  return { group, members, rounds, payments };
}
