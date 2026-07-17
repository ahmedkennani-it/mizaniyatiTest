import { AR_DICTATION_KEYWORDS, EN_DICTATION_KEYWORDS, FR_DICTATION_KEYWORDS } from './dictationKeywords';
import type { DictationKeyword } from './dictationKeywords';
import type { SupportedLanguage } from '../i18n';

const KEYWORDS_BY_LANGUAGE: Record<SupportedLanguage, DictationKeyword[]> = {
  fr: FR_DICTATION_KEYWORDS,
  en: EN_DICTATION_KEYWORDS,
  ar: AR_DICTATION_KEYWORDS,
};

export interface DeducedCategoryAndLabel {
  label: string;
  categoryIcon: string;
}

/**
 * Deduces a label and a suggested category icon from a dictated sentence (US-021b) —
 * "Quarante-deux dirhams de café ce matin" → `{ label: 'Café', categoryIcon: 'utensils' }`. Only
 * ever matches a known word (see `dictationKeywords/*`); everything else in the sentence (the
 * amount, the currency name, "ce matin") is simply never a candidate, so nothing more elaborate
 * than a keyword scan is needed to ignore it. Returns `null` when no known word is found — the
 * household picks a category and a label by hand, same as any manually typed entry.
 */
export function deduceCategoryAndLabel(
  text: string,
  language: SupportedLanguage,
): DeducedCategoryAndLabel | null {
  const normalized = text.toLowerCase();
  const keywords = KEYWORDS_BY_LANGUAGE[language];
  for (const entry of keywords) {
    if (normalized.includes(entry.keyword)) {
      return { label: entry.label, categoryIcon: entry.categoryIcon };
    }
  }
  return null;
}
