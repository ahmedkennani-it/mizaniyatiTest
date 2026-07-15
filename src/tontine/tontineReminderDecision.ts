import type { TontinePaymentStatus } from '../db/repositories';
import { isWithinQuietHours } from '../notifications';

export interface TontineReminderDecisionInput {
  /** Whether the user opted in to this group's payment reminder (off by default). */
  enabled: boolean;
  now: Date;
  /** Whether a reminder was already sent for this group this month. */
  alreadyRemindedThisMonth: boolean;
  /** Whether the current round's month is this calendar month (nothing to remind about otherwise). */
  isCurrentRoundThisMonth: boolean;
  /** This household's own payment status for the current round, or `null` if not found. */
  selfPaymentStatus: TontinePaymentStatus | null;
}

/**
 * Whether to send a "paiement de tour dû" reminder for a tontine group, per
 * `docs/specs/tontine.md`. Pure decision function, mirrors `shouldSendBudgetAlert`'s shape
 * (opt-in, no-repeat-this-month, quiet hours) — callers gather the inputs from
 * `TontineGroup`/`findCurrentRound`/`TontinePayment` and pass them in.
 */
export function shouldSendTontineReminder(input: TontineReminderDecisionInput): boolean {
  if (!input.enabled) {
    return false;
  }
  if (input.alreadyRemindedThisMonth) {
    return false;
  }
  if (!input.isCurrentRoundThisMonth) {
    return false;
  }
  if (isWithinQuietHours(input.now)) {
    return false;
  }
  return input.selfPaymentStatus === 'pending';
}
