import { isWithinQuietHours } from '../notifications';

export interface DebtReminderDecisionInput {
  now: Date;
  /** ISO `YYYY-MM-DD` the household agreed on, or `null` if no deadline was set. */
  dueDate: string | null;
  /** Computed from repayments (`computeDebtStatus`) — a settled debt never needs a reminder. */
  isSettled: boolean;
  /** `null` until the reminder has fired once for this debt. */
  remindedAt: string | null;
}

/**
 * Whether to send a "l'échéance de ta dette est arrivée" reminder (US-049). Pure decision
 * function, same shape as `shouldSendZakatReminder`/`shouldSendTontineReminder` (quiet hours, no
 * repeat, a concrete trigger condition) — a debt with no `dueDate` at all simply never reminds,
 * matching the criterion "échéance (ou 'pas d'échéance')".
 */
export function shouldSendDebtReminder(input: DebtReminderDecisionInput): boolean {
  if (input.isSettled || input.remindedAt !== null || input.dueDate === null) {
    return false;
  }
  if (isWithinQuietHours(input.now)) {
    return false;
  }
  const today = input.now.toISOString().slice(0, 10);
  return today >= input.dueDate;
}
