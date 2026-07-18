import type { Category } from '../db/repositories';
import type { SupportedLanguage } from '../i18n/i18n';
import { DEFAULT_COUNTRY_CODE } from '../market';
import { getDefaultCategories } from './defaultCategories';

const LANGUAGES: SupportedLanguage[] = ['fr', 'ar', 'en'];

/**
 * icon -> { fr: name, ar: name, en: name } for every default category (including "Zakat & dons",
 * seeded only for MENA/Gulf markets but its name variants are the same regardless of market, so a
 * MENA country code here just guarantees it's included in the lookup).
 */
function buildIconTranslations(): Map<string, Partial<Record<SupportedLanguage, string>>> {
  const map = new Map<string, Partial<Record<SupportedLanguage, string>>>();
  for (const language of LANGUAGES) {
    for (const definition of getDefaultCategories(language, DEFAULT_COUNTRY_CODE)) {
      const entry = map.get(definition.icon) ?? {};
      entry[language] = definition.name;
      map.set(definition.icon, entry);
    }
  }
  return map;
}

const ICON_TRANSLATIONS = buildIconTranslations();

/**
 * A default category's name retranslates live on language switch (US-056); a category the
 * household has renamed, or created themselves, never does. `Category.name` stores a plain string,
 * not an i18n key (renaming a default works exactly like renaming a custom one — see
 * `getDefaultCategories`'s own docstring), so there's no stored flag for "still exactly as
 * seeded". The only safe signal is comparing the *current* name against the known fr/ar/en
 * translations for its icon: still matching one of them means presumably untouched, so the active
 * language's translation is shown; matching none means it was edited (or is fully custom), so the
 * stored name is shown exactly as-is.
 */
export function resolveCategoryDisplayName(
  category: Pick<Category, 'name' | 'icon' | 'isDefault'>,
  language: SupportedLanguage,
): string {
  if (!category.isDefault) {
    return category.name;
  }
  const translations = ICON_TRANSLATIONS.get(category.icon);
  if (!translations) {
    return category.name;
  }
  const isPristine = Object.values(translations).includes(category.name);
  if (!isPristine) {
    return category.name;
  }
  return translations[language] ?? category.name;
}
