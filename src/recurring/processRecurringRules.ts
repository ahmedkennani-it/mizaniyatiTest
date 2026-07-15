import { createTransaction, listCategories, listRecurringRules, updateRecurringRule } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import i18n from '../i18n/i18n';
import { notificationClient } from '../notifications';
import { computeDueOccurrenceDates } from './recurringOccurrences';

/**
 * Runs at every app start (`db/bootstrap.ts`'s `ensureAppReady`, alongside the other seeds): for
 * every non-paused `mode: 'auto'` rule, creates a `Transaction` for each occurrence
 * `computeDueOccurrenceDates` says is due, sends one notification per rule summarizing what was
 * added, then advances `lastRunDate` to the latest occurrence processed — "la transaction est
 * créée automatiquement et notifiée" (`docs/specs/transactions-recurrentes.md`).
 *
 * `mode: 'prompt'` rules are deliberately left untouched here: `RecurringRulesScreen` recomputes
 * their due dates on demand so the user can confirm/modify/ignore each one, and `lastRunDate`
 * only advances once a proposal is actually resolved (see that screen).
 */
export async function processRecurringRules(db: SqlDatabase, now: Date = new Date()): Promise<void> {
  const [rules, categories] = await Promise.all([listRecurringRules(db), listCategories(db)]);

  for (const rule of rules) {
    if (rule.mode !== 'auto') {
      continue;
    }
    const due = computeDueOccurrenceDates(rule, now);
    if (due.length === 0) {
      continue;
    }

    for (const occurrence of due) {
      await createTransaction(db, {
        type: rule.type,
        amountMinor: rule.amountMinor,
        currencyCode: rule.currencyCode,
        categoryId: rule.categoryId,
        memberId: rule.memberId,
        occurredAt: `${occurrence}T09:00:00.000Z`,
        note: rule.note,
      });
    }

    await updateRecurringRule(db, rule.id, { lastRunDate: due[due.length - 1] });

    const category = categories.find((candidate) => candidate.id === rule.categoryId);
    await notificationClient.presentNow({
      title: i18n.t('notifications.recurringAutoTitle'),
      body: i18n.t('notifications.recurringAutoBody', {
        count: due.length,
        category: category?.name ?? '',
      }),
    });
  }
}
