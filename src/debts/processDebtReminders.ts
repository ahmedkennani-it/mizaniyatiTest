import { listDebtRepayments, listDebts, markDebtReminded } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import i18n from '../i18n/i18n';
import type { SupportedLanguage } from '../i18n/i18n';
import { formatMoney } from '../money';
import { notificationClient } from '../notifications';
import { computeDebtStatus } from './computeDebtStatus';
import { shouldSendDebtReminder } from './debtReminderDecision';

/**
 * Runs at every app start (`db/bootstrap.ts`'s `ensureAppReady`, alongside the tontine/Zakat
 * processors): for every unsettled debt whose agreed due date has arrived, sends one reminder
 * notification, then marks it reminded so it never repeats (US-049 — "étant donné une échéance
 * atteinte, alors une notification de rappel est envoyée").
 */
export async function processDebtReminders(db: SqlDatabase, now: Date = new Date()): Promise<void> {
  const [debts, repayments] = await Promise.all([listDebts(db), listDebtRepayments(db)]);

  for (const debt of debts) {
    const status = computeDebtStatus(debt, repayments);
    const decision = shouldSendDebtReminder({
      now,
      dueDate: debt.dueDate,
      isSettled: status.isSettled,
      remindedAt: debt.remindedAt,
    });
    if (!decision) {
      continue;
    }

    await notificationClient.presentNow({
      title: i18n.t('notifications.debtReminderTitle'),
      body: i18n.t('notifications.debtReminderBody', {
        counterparty: debt.counterparty,
        amount: formatMoney(status.remainingMinor, debt.currencyCode, i18n.language as SupportedLanguage),
      }),
    });
    await markDebtReminded(db, debt.id, now.toISOString());
  }
}
