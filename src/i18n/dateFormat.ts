import type { SupportedLanguage } from './i18n';
import { resolveIntlLocale, toLocalizedDigits } from './numberFormat';

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

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
/** Past this, "il y a 5 semaines" is harder to place than the date itself. */
const RELATIVE_DAY_LIMIT = 7;

/** Whole days between two instants, counted on calendar days rather than elapsed hours — 23:00
 * yesterday to 01:00 today is "hier", not "il y a 0 jour". */
function calendarDaysBetween(from: Date, to: Date): number {
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const startOfTo = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((startOfTo - startOfFrom) / MILLISECONDS_PER_DAY);
}

/**
 * "Aujourd'hui" / "hier" / "il y a 3 jours" in the active language (US-074b). Falls back to the
 * short numeric date beyond a week old, and for any future date: a transaction dated next month
 * reads better as its date than as "dans 4 semaines".
 */
export function formatRelativeDate(
  date: Date,
  language: SupportedLanguage,
  now: Date = new Date(),
): string {
  const daysAgo = calendarDaysBetween(date, now);
  if (daysAgo < 0 || daysAgo > RELATIVE_DAY_LIMIT) {
    return formatShortDate(date, language);
  }
  // The day count is rendered through `toLocalizedDigits` and spliced back into the formatted
  // parts rather than left to `RelativeTimeFormat`, which offers no dependable control over its
  // numbering system: the CLDR polyfill standing in for it on Hermes (`intlPolyfills.ts`) always
  // resolves `nu` to `latn` — whatever the locale tag or the `numberingSystem` option asks for —
  // so Arabic read "قبل 3 أيام" there while reading "قبل ٣ أيام" under Node. Formatting the digits
  // ourselves keeps the two engines in agreement. Days 0–2 come back as a single literal
  // ("aujourd'hui", "أمس") under `numeric: 'auto'` and pass through untouched.
  return new Intl.RelativeTimeFormat(resolveIntlLocale(language).locale, { numeric: 'auto' })
    .formatToParts(-daysAgo, 'day')
    .map((part) => (part.type === 'literal' ? part.value : toLocalizedDigits(daysAgo, language)))
    .join('');
}
