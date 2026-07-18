import type { Category } from '../db/repositories';
import type { SupportedLanguage } from '../i18n/i18n';
import { KNOWN_CATEGORY_NAME_VARIANTS } from './defaultCategories';

/**
 * A default category's name retranslates live on language switch (US-056); a category the
 * household has renamed, or created themselves, never does. `Category.name` stores a plain string,
 * not an i18n key (renaming a default works exactly like renaming a custom one — see
 * `getDefaultCategories`'s own docstring), so there's no stored flag for "still exactly as
 * seeded". The only safe signal is comparing the *current* name against `KNOWN_CATEGORY_NAME_VARIANTS`:
 * still matching one of the known {fr, ar, en} families for its icon means presumably untouched,
 * so that family's active-language name is shown; matching none means it was edited (or is fully
 * custom), so the stored name is shown exactly as-is. Some icons (e.g. "school") carry more than
 * one family — the base "École" set and the Gulf-only "Écoles des enfants" one — matching stays
 * within whichever family the current name actually belongs to, never mixing the two.
 */
export function resolveCategoryDisplayName(
  category: Pick<Category, 'name' | 'icon' | 'isDefault'>,
  language: SupportedLanguage,
): string {
  if (!category.isDefault) {
    return category.name;
  }
  const variant = KNOWN_CATEGORY_NAME_VARIANTS.find(
    (candidate) => candidate.icon === category.icon && Object.values(candidate.names).includes(category.name),
  );
  return variant ? variant.names[language] : category.name;
}
