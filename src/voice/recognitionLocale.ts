import { resolveIntlLocale } from '../i18n/numberFormat';
import type { SupportedLanguage } from '../i18n';

/**
 * BCP-47 tag the speech recognizer should listen for. Reuses the same market locale
 * (`fr-MA`/`ar-MA`/`en-US`) the number/date formatters already resolve for the app language,
 * rather than a second table that could drift from it.
 */
export function recognitionLocale(language: SupportedLanguage): string {
  return resolveIntlLocale(language).locale;
}
