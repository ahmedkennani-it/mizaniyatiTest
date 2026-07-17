import { isWithinQuietHours } from '../notifications';

export interface ZakatReminderDecisionInput {
  now: Date;
  /** ISO `YYYY-MM-DD` the household chose to pay by, or `null` if no date was planned. */
  dueDate: string | null;
  /** `null` once paid — a paid plan never needs a reminder. */
  paidAt: string | null;
  /** `null` until the reminder has fired once for this plan. */
  remindedAt: string | null;
}

/**
 * Whether to send a "ta Zakat planifiée arrive à échéance" reminder (US-043). Pure decision
 * function, same shape as `shouldSendTontineReminder`/`shouldSendBudgetAlert` (quiet hours, no
 * repeat, a concrete trigger condition) — the "opt-in" here is simply having chosen a `dueDate` in
 * the first place, rather than a separate settings toggle.
 */
export function shouldSendZakatReminder(input: ZakatReminderDecisionInput): boolean {
  if (input.paidAt !== null || input.remindedAt !== null || input.dueDate === null) {
    return false;
  }
  if (isWithinQuietHours(input.now)) {
    return false;
  }
  const today = input.now.toISOString().slice(0, 10);
  return today >= input.dueDate;
}
