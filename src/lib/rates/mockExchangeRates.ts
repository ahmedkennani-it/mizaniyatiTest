import { currencyDecimals, toMajorUnits } from '../../money';

/**
 * Fictional, fixed exchange rates for demo/development purposes only — Mizaniyati never calls a
 * live FX API (per the project's guardrails). Expressed as "units of currency per 1 USD" so any
 * pair can be converted through a common base without a full N×N table. Covers the markets in
 * `src/market/markets.ts`. Update by hand if the demo numbers ever need to look fresher; there is
 * no automated refresh.
 */
export const MOCK_RATES_UPDATED_AT = '2026-01-01';

/** Shown next to any converted amount, per the "toujours indicative" rule (US-047, US-064). */
export const MOCK_RATES_SOURCE = 'Taux fictifs (données de démonstration)';

/**
 * Placeholder "pays d'origine" currency used to compute the Transferts screen's contre-valeur
 * (US-045) until US-064 (phase 15) lets each diaspora household configure its own. MAD, the
 * launch market's currency, is the only real destination today since the diaspora markets (FR,
 * AE, SA) aren't selectable at onboarding yet — see `src/market/markets.ts`.
 */
export const DEFAULT_ORIGIN_CURRENCY_CODE = 'MAD';

export const MOCK_RATES_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  MAD: 9.9,
  DZD: 134.5,
  TND: 3.13,
  EGP: 49.2,
  AED: 3.67,
  SAR: 3.75,
};

/**
 * Converts an integer minor-unit amount from one currency to another through the mock USD table
 * above. Returns `null` when either currency isn't in the table — callers must treat that as "no
 * indicative rate available" rather than silently assuming a 1:1 rate.
 */
export function convertAmountMinor(
  amountMinor: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
): number | null {
  if (fromCurrencyCode === toCurrencyCode) {
    return amountMinor;
  }
  const fromRate = MOCK_RATES_PER_USD[fromCurrencyCode];
  const toRate = MOCK_RATES_PER_USD[toCurrencyCode];
  if (fromRate === undefined || toRate === undefined) {
    return null;
  }
  const majorInUsd = toMajorUnits(amountMinor, fromCurrencyCode) / fromRate;
  const majorInTarget = majorInUsd * toRate;
  return Math.round(majorInTarget * 10 ** currencyDecimals(toCurrencyCode));
}
