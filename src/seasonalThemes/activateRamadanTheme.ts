import { createCategory, createSeasonalTheme } from '../db/repositories';
import type { Category, SeasonalTheme } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import type { SupportedLanguage } from '../i18n/i18n';
import { getRamadanSubcategories } from './ramadanSubcategories';

export interface ActivateRamadanThemeInput {
  /** ISO date `YYYY-MM-DD` — manually adjustable (cas limite: source calendaire incertaine). */
  startDate: string;
  endDate: string;
  envelopeMinor: number;
  currencyCode: string;
  language: SupportedLanguage;
}

/**
 * Activates Ramadan mode (US-026, `docs/specs/mode-ramadan.md`): creates the `SeasonalTheme` row
 * and its four dedicated sub-categories (Iftar & Suhoor, Zakat al-Fitr, Aïd & cadeaux, Invités &
 * famille), each tagged with `seasonalThemeId` so `computeSeasonalThemeStatus` can sum only their
 * spend against the envelope — never mixing in regular category spending ("éviter le double
 * comptage"). Each activation gets its own fresh categories, so re-activating Ramadan next year
 * doesn't carry over this year's spend into the new envelope.
 */
export async function activateRamadanTheme(
  db: SqlDatabase,
  input: ActivateRamadanThemeInput,
): Promise<{ theme: SeasonalTheme; categories: Category[] }> {
  const theme = await createSeasonalTheme(db, {
    type: 'ramadan',
    active: true,
    startDate: input.startDate,
    endDate: input.endDate,
    envelopeMinor: input.envelopeMinor,
    currencyCode: input.currencyCode,
  });

  const categories: Category[] = [];
  for (const subcategory of getRamadanSubcategories(input.language)) {
    const category = await createCategory(db, {
      name: subcategory.name,
      icon: subcategory.icon,
      color: subcategory.color,
      seasonalThemeId: theme.id,
    });
    categories.push(category);
  }

  return { theme, categories };
}
