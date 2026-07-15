import { seedDefaultCategories } from '../categories';
import { seedDefaultMember } from '../members';
import type { SupportedLanguage } from '../i18n/i18n';
import { processRecurringRules } from '../recurring';
import { processTontineReminders } from '../tontine';
import { ensureMigrated, getDatabase } from './client';

/**
 * Runs everything the app needs before any screen touching the database can render: migrations,
 * then the default-categories/default-member seeds, then auto-mode recurring rules ("rattrapage
 * des échéances dues" — US-021/US-022), then tontine payment reminders (US-024). All of these are
 * idempotent/safe to re-run, so calling this more than once (e.g. across remounts) is harmless.
 */
export async function ensureAppReady(language: SupportedLanguage): Promise<void> {
  await ensureMigrated();
  const db = getDatabase();
  await seedDefaultCategories(db, language);
  await seedDefaultMember(db, language);
  await processRecurringRules(db);
  await processTontineReminders(db);
}
