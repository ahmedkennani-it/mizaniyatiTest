import type { SubscriptionProductId } from '../db/repositories';

export type PurchaseProductId = SubscriptionProductId;

export interface PurchaseProduct {
  id: PurchaseProductId;
  /** How long a successful purchase of this product unlocks Pro for. */
  durationDays: number;
}

/**
 * The two subscription products this app offers (US-066a/US-066b). Declared locally rather than
 * fetched from a real store — per the project's guardrail, purchases are always a local mock,
 * never a hardcoded real RevenueCat/App Store/Play integration (see `CLAUDE.md`). Indicative
 * per-market pricing is a separate concern (US-066b) and lives alongside whichever screen displays
 * it, not here.
 */
export const PURCHASE_PRODUCTS: PurchaseProduct[] = [
  { id: 'monthly', durationDays: 30 },
  { id: 'annual', durationDays: 365 },
];

/**
 * Stands in for a real store SDK's "list available products" call (e.g.
 * `Purchases.getOfferings()`) — async to mirror that shape, even though it never leaves the
 * device.
 */
export async function fetchAvailableProducts(): Promise<PurchaseProduct[]> {
  return PURCHASE_PRODUCTS;
}

export function findPurchaseProduct(id: PurchaseProductId): PurchaseProduct {
  const product = PURCHASE_PRODUCTS.find((candidate) => candidate.id === id);
  if (!product) {
    throw new Error(`Unknown purchase product: ${id}`);
  }
  return product;
}
