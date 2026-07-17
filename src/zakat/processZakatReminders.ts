import { listZakatAssessments, markZakatAssessmentReminded } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import i18n from '../i18n/i18n';
import { notificationClient } from '../notifications';
import { shouldSendZakatReminder } from './zakatReminderDecision';

/**
 * Runs at every app start (`db/bootstrap.ts`'s `ensureAppReady`, alongside the tontine/recurring
 * processors): for every planned-but-unpaid Zakat assessment whose chosen due date has arrived,
 * sends one reminder notification, then marks it reminded so it never repeats for that plan
 * (US-043 — "étant donné une échéance planifiée, un rappel est envoyé à la date choisie").
 */
export async function processZakatReminders(db: SqlDatabase, now: Date = new Date()): Promise<void> {
  const assessments = await listZakatAssessments(db);

  for (const assessment of assessments) {
    const decision = shouldSendZakatReminder({
      now,
      dueDate: assessment.dueDate,
      paidAt: assessment.paidAt,
      remindedAt: assessment.remindedAt,
    });
    if (!decision) {
      continue;
    }

    await notificationClient.presentNow({
      title: i18n.t('notifications.zakatReminderTitle'),
      body: i18n.t('notifications.zakatReminderBody'),
    });
    await markZakatAssessmentReminded(db, assessment.id, now.toISOString());
  }
}
