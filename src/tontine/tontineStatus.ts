import type { TontineMember, TontinePayment, TontineRound } from '../db/repositories';

export interface TontineMemberPaymentStatus {
  member: TontineMember;
  payment: TontinePayment | null;
}

export interface TontineRoundStatus {
  round: TontineRound;
  beneficiary: TontineMember | null;
  paidCount: number;
  totalCount: number;
  memberStatuses: TontineMemberPaymentStatus[];
}

/**
 * "Cagnotte/tour, tour courant, bénéficiaire et état des paiements" per
 * `docs/specs/tontine.md`. Pure function, no DB access — same recompute-from-already-loaded-data
 * pattern as `computeCategoryBudgetStatus`/`computeVaultStatus`.
 */
export function computeRoundStatus(
  round: TontineRound,
  payments: TontinePayment[],
  members: TontineMember[],
): TontineRoundStatus {
  const roundPayments = payments.filter((payment) => payment.roundId === round.id);
  const memberStatuses: TontineMemberPaymentStatus[] = members.map((member) => ({
    member,
    payment: roundPayments.find((payment) => payment.memberId === member.id) ?? null,
  }));

  return {
    round,
    beneficiary: members.find((member) => member.id === round.beneficiaryMemberId) ?? null,
    paidCount: memberStatuses.filter((status) => status.payment?.status === 'paid').length,
    totalCount: members.length,
    memberStatuses,
  };
}

function sortByMonth(rounds: TontineRound[]): TontineRound[] {
  return [...rounds].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

/**
 * The round to show as "current": the one whose month matches `now`, else the next upcoming
 * round, else — if every round is already in the past — the last one (so the screen never shows
 * nothing once a cycle has finished).
 */
export function findCurrentRound(rounds: TontineRound[], now: Date): TontineRound | null {
  if (rounds.length === 0) {
    return null;
  }
  const monthKey = now.toISOString().slice(0, 7);
  const exact = rounds.find((round) => round.month === monthKey);
  if (exact) {
    return exact;
  }
  const sorted = sortByMonth(rounds);
  const upcoming = sorted.find((round) => round.month > monthKey);
  return upcoming ?? sorted[sorted.length - 1];
}

/** "Mon tour" — the round whose beneficiary is this household's own participant (`isSelf`). */
export function findMyRound(rounds: TontineRound[], members: TontineMember[]): TontineRound | null {
  const self = members.find((member) => member.isSelf);
  if (!self) {
    return null;
  }
  return rounds.find((round) => round.beneficiaryMemberId === self.id) ?? null;
}

/** Whole calendar months between `now` and a `YYYY-MM` month key. Negative once it's in the past. */
export function monthsUntil(now: Date, monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return (year - now.getUTCFullYear()) * 12 + (month - 1 - now.getUTCMonth());
}
