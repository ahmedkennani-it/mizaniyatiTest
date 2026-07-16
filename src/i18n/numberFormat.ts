import type { SupportedLanguage } from './i18n';

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  // `fr-FR`, not `fr-MA`, on purpose. CLDR groups Moroccan French thousands with a period
  // (`1.234,50`), but US-062 specifies a non-breaking space (`1 234,50`) — and `fr-FR` is the only
  // difference-free way to get it: the two locales are otherwise identical here (same comma
  // decimal, same date patterns, same month names).
  fr: 'fr-FR',
  ar: 'ar-MA',
  // Anglo-Saxon formatting (comma thousands, dot decimal) for the English catalog.
  en: 'en-US',
};

const NUMBERING_SYSTEM_BY_LANGUAGE: Record<SupportedLanguage, string | undefined> = {
  fr: undefined,
  ar: 'arab',
  en: undefined,
};

export interface IntlLocale {
  locale: string;
  numberingSystem?: string;
}

/** Resolves the `Intl` locale + numbering system (Arabic-indic for `ar`) for the app language. */
export function resolveIntlLocale(language: SupportedLanguage): IntlLocale {
  return {
    locale: LOCALE_BY_LANGUAGE[language],
    numberingSystem: NUMBERING_SYSTEM_BY_LANGUAGE[language],
  };
}

/** Renders digits per the active locale — Arabic-indic (٠١٢…) for `ar`, Western otherwise. */
export function toLocalizedDigits(value: number, language: SupportedLanguage): string {
  const { locale, numberingSystem } = resolveIntlLocale(language);
  return new Intl.NumberFormat(locale, { numberingSystem, maximumFractionDigits: 2 }).format(value);
}

const LEFT_TO_RIGHT_MARK = '\u200E';

/** Wraps text with left-to-right marks so it reads LTR even inside RTL (Arabic) contexts. */
export function forceLTR(text: string): string {
  return `${LEFT_TO_RIGHT_MARK}${text}${LEFT_TO_RIGHT_MARK}`;
}
