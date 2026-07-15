import {
  listTontineGroups,
  listTontineMembers,
  listTontinePayments,
  listTontineRounds,
  updateTontineGroup,
} from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import i18n from '../i18n/i18n';
import type { SupportedLanguage } from '../i18n/i18n';
import { formatMoney } from '../money';
import { notificationClient } from '../notifications';
import { findCurrentRound } from './tontineStatus';
import { shouldSendTontineReminder } from './tontineReminderDecision';

/**
 * Runs at every app start (`db/bootstrap.ts`'s `ensureAppReady`, alongside the other seeds/
 * recurring-rule processing): for every group with `reminderEnabled` whose current round falls
 * this month and whose self participant hasn't paid yet, sends one opt-in reminder notification
 * — "Given un rappel activé, When l'échéance du tour approche, Then une notification m'invite à
 * payer" (`docs/specs/tontine.md`). `lastRemindedMonth` then advances so it never repeats within
 * the same month, mirroring `CategoryBudget.lastAlertedMonth`'s no-spam bookkeeping.
 */
export async function processTontineReminders(
  db: SqlDatabase,
  now: Date = new Date(),
): Promise<void> {
  const [groups, members, rounds, payments] = await Promise.all([
    listTontineGroups(db),
    listTontineMembers(db),
    listTontineRounds(db),
    listTontinePayments(db),
  ]);

  const monthKey = now.toISOString().slice(0, 7);

  for (const group of groups) {
    const groupMembers = members.filter((member) => member.groupId === group.id);
    const groupRounds = rounds.filter((round) => round.groupId === group.id);
    const self = groupMembers.find((member) => member.isSelf);
    const currentRound = findCurrentRound(groupRounds, now);
    if (!self || !currentRound) {
      continue;
    }

    const selfPayment = payments.find(
      (payment) => payment.roundId === currentRound.id && payment.memberId === self.id,
    );

    const decision = shouldSendTontineReminder({
      enabled: group.reminderEnabled,
      now,
      alreadyRemindedThisMonth: group.lastRemindedMonth === monthKey,
      isCurrentRoundThisMonth: currentRound.month === monthKey,
      selfPaymentStatus: selfPayment?.status ?? null,
    });
    if (!decision) {
      continue;
    }

    await notificationClient.presentNow({
      title: i18n.t('notifications.tontineReminderTitle'),
      body: i18n.t('notifications.tontineReminderBody', {
        group: group.name,
        amount: formatMoney(
          group.contributionPerRoundMinor,
          group.currencyCode,
          i18n.language as SupportedLanguage,
        ),
      }),
    });
    await updateTontineGroup(db, group.id, { lastRemindedMonth: monthKey });
  }
}
