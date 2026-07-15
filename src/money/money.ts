import type { SupportedLanguage } from '../i18n/i18n';
import { forceLTR, resolveIntlLocale } from '../i18n/numberFormat';

/** ISO 4217 currency code used when a household hasn't picked one — Morocco is the launch market. */
export const DEFAULT_CURRENCY_CODE = 'MAD';

/**
 * Converts an integer amount in the currency's minor unit (e.g. centimes) to a plain major-unit
 * number, for **display only** — never store or recompute historical `amountMinor` values from
 * this. The minor-unit exponent (2 for MAD/EUR, 0 for JPY, 3 for BHD, …) comes from `Intl` itself
 * rather than a hardcoded table, so any valid ISO 4217 code works without maintenance.
 */
export function toMajorUnits(amountMinor: number, currencyCode: string): number {
  const exponent =
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return amountMinor / 10 ** exponent;
}

/**
 * Formats an integer minor-unit amount as a currency string in the active app language, always
 * reading left-to-right (per `.claude/rules/i18n-rtl-money.md`) with locale-appropriate digits
 * (Arabic-indic for `ar`). A transaction's own `currencyCode` is always passed in explicitly —
 * this never converts between currencies, so historical amounts are never silently rewritten.
 */
export function formatMoney(
  amountMinor: number,
  currencyCode: string,
  language: SupportedLanguage,
): string {
  const { locale, numberingSystem } = resolveIntlLocale(language);
  const major = toMajorUnits(amountMinor, currencyCode);
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    numberingSystem,
  }).format(major);
  return forceLTR(formatted);
}

/**
 * Parses a user-typed amount (e.g. from a keyboard entry form) into an integer minor-unit value,
 * the inverse of `toMajorUnits`. Accepts `.` or `,` as the decimal separator. Returns `null` for
 * anything that isn't a strictly positive number (empty, non-numeric, zero, negative) — callers
 * must reject `null` rather than saving a guessed amount, per the spec's "montant ambigu" rule.
 */
export function parseAmountInput(input: string, currencyCode: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '' || Number.isNaN(Number(normalized))) {
    return null;
  }
  const major = Number(normalized);
  if (!Number.isFinite(major) || major <= 0) {
    return null;
  }
  const exponent =
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return Math.round(major * 10 ** exponent);
}

/**
 * Like `parseAmountInput`, but for fields where **zero is a legitimate value** (e.g. "aucune
 * dette" in the Zakat calculator) — an empty input parses to `0` instead of `null`, and `0` itself
 * is accepted. Still rejects negative/non-numeric input. Use `parseAmountInput` instead for
 * anything that must be strictly positive (a transaction amount, a category cap, …).
 */
export function parseNonNegativeAmountInput(input: string, currencyCode: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') {
    return 0;
  }
  const major = Number(normalized);
  if (!Number.isFinite(major) || major < 0) {
    return null;
  }
  const exponent =
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return Math.round(major * 10 ** exponent);
}
