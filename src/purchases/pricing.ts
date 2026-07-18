import { convertAmountMinor } from '../lib/rates';
import type { PurchaseProductId } from './products';

/**
 * Indicative MAD list prices (US-066b) — fictional/mock, like every other price in this app
 * (`src/lib/rates`'s own convention); never a real store-configured price. 39 MAD/month,
 * 279 MAD/year (≈ -40% versus twelve months at the monthly rate).
 */
const BASE_PRICE_MINOR_MAD: Record<PurchaseProductId, number> = {
  monthly: 3900,
  annual: 27900,
};

const PRICING_BASE_CURRENCY_CODE = 'MAD';

export interface ProductPrice {
  id: PurchaseProductId;
  amountMinor: number;
  currencyCode: string;
}

/**
 * Converts the MAD list price into `currencyCode` (US-066b's "grille du marché"), through the same
 * mock exchange-rate table the Transferts screen uses — never a live rate. Falls back to the MAD
 * amount, in MAD, for a currency the mock table doesn't cover, so the paywall never shows a blank
 * price.
 */
export function priceFor(productId: PurchaseProductId, currencyCode: string): ProductPrice {
  const baseMinor = BASE_PRICE_MINOR_MAD[productId];
  const converted = convertAmountMinor(baseMinor, PRICING_BASE_CURRENCY_CODE, currencyCode);
  return converted !== null
    ? { id: productId, amountMinor: converted, currencyCode }
    : { id: productId, amountMinor: baseMinor, currencyCode: PRICING_BASE_CURRENCY_CODE };
}

/**
 * How much cheaper the annual product is versus twelve months at the monthly rate — computed from
 * the MAD base prices only (a pure ratio, so it's the same badge in every currency regardless of
 * mock-rate rounding at the minor-unit level).
 */
export function annualDiscountPercent(): number {
  const fullYearAtMonthlyRate = BASE_PRICE_MINOR_MAD.monthly * 12;
  return Math.round((1 - BASE_PRICE_MINOR_MAD.annual / fullYearAtMonthlyRate) * 100);
}
