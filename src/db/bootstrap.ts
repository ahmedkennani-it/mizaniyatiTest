import { seedDefaultCategories } from '../categories';
import { processDebtReminders } from '../debts';
import { seedDefaultMember } from '../members';
import type { SupportedLanguage } from '../i18n/i18n';
import { processRecurringRules } from '../recurring';
import { processTontineReminders } from '../tontine';
import { processZakatReminders } from '../zakat';
import { ensureMigrated, getDatabase } from './client';

/**
 * Runs everything the app needs before any screen touching the database can render: migrations,
 * then the default-categories/default-member seeds, then auto-mode recurring rules ("rattrapage
 * des échéances dues" — US-021/US-022), then tontine payment reminders (US-024), planned-Zakat
 * due-date reminders (US-043), and informal-debt due-date reminders (US-049). All of these are
 * idempotent/safe to re-run, so calling this more than once (e.g. across remounts) is harmless.
 */
export async function ensureAppReady(
  language: SupportedLanguage,
  countryCode?: string,
): Promise<void> {
  await ensureMigrated();
  const db = getDatabase();
  await seedDefaultCategories(db, language, countryCode);
  await seedDefaultMember(db, language);
  await processRecurringRules(db);
  await processTontineReminders(db);
  await processZakatReminders(db);
  await processDebtReminders(db);
}
