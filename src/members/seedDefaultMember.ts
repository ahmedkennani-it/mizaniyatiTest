import { createMember, listMembers } from '../db/repositories';
import type { Member } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import type { SupportedLanguage } from '../i18n/i18n';

const DEFAULT_NAME_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  fr: 'Moi',
  ar: 'أنا',
  en: 'Me',
};

/**
 * Ensures at least one household member exists (US-010): the onboarding flow (US-023) only
 * collects language/country, not a "self" member name yet (family sharing/invitations land in
 * US-039/US-040), so without this seed a member picker would be permanently empty. Idempotent:
 * no-ops if any member already exists, mirroring `seedDefaultCategories`'s pattern.
 */
export async function seedDefaultMember(
  db: SqlDatabase,
  language: SupportedLanguage,
): Promise<Member> {
  const existing = await listMembers(db);
  if (existing.length > 0) {
    return existing[0];
  }
  return createMember(db, { name: DEFAULT_NAME_BY_LANGUAGE[language] });
}
