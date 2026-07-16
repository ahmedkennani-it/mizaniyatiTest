import type { SupportedLanguage } from './i18n';
import { resolveIntlLocale } from './numberFormat';

/** `YYYY-MM` → a first-of-month local `Date`, the shape month labels are formatted from. */
export function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** A `Date` → its `YYYY-MM` key, the form months are stored and compared in. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * "Juin 2026" / "يونيو ٢٠٢٦" / "June 2026" — the month name in the active language, with that
 * language's digits (US-062). Falls back to the raw `YYYY-MM` key rather than throwing if the key
 * is malformed, so a bad stored value degrades to something readable instead of blanking a screen.
 */
export function formatMonthLabel(monthKey: string, language: SupportedLanguage): string {
  const { locale, numberingSystem } = resolveIntlLocale(language);
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      numberingSystem,
    }).format(monthKeyToDate(monthKey));
  } catch {
    return monthKey;
  }
}

/** A full date ("15 juin 2026" / "١٥ يونيو ٢٠٢٦" / "June 15, 2026") in the active language. */
export function formatLongDate(date: Date, language: SupportedLanguage): string {
  const { locale, numberingSystem } = resolveIntlLocale(language);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', numberingSystem }).format(date);
}

/** A compact numeric date ("15/06/2026") in the active language, for dense rows and lists. */
export function formatShortDate(date: Date, language: SupportedLanguage): string {
  const { locale, numberingSystem } = resolveIntlLocale(language);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', numberingSystem }).format(date);
}
