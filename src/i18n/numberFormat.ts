import type { SupportedLanguage } from './i18n';

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  fr: 'fr-MA',
  ar: 'ar-MA',
};

const NUMBERING_SYSTEM_BY_LANGUAGE: Record<SupportedLanguage, string | undefined> = {
  fr: undefined,
  ar: 'arab',
};

export interface IntlLocale {
  locale: string;
  numberingSystem?: string;
}

/** Resolves the `Intl` locale + numbering system (Arabic-indic for `ar`) for the app language. */
export function resolveIntlLocale(language: SupportedLanguage): IntlLocale {
  return { locale: LOCALE_BY_LANGUAGE[language], numberingSystem: NUMBERING_SYSTEM_BY_LANGUAGE[language] };
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
