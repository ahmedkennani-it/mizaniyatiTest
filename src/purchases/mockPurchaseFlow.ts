import { getSubscription, upsertSubscription } from '../db/repositories';
import type { Subscription } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import { PRO_PLAN } from '../entitlements';
import { resolveActivePlan } from '../subscriptions';
import { findPurchaseProduct } from './products';
import type { PurchaseProductId } from './products';

/** The household backed out of the platform's own purchase sheet — not an app error. */
export class PurchaseCancelledError extends Error {
  constructor() {
    super('purchase_cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

/** The (mock) store call couldn't complete — stands in for "no connection" from a real store. */
export class PurchaseNetworkError extends Error {
  constructor() {
    super('purchase_network_error');
    this.name = 'PurchaseNetworkError';
  }
}

export type MockPurchaseOutcome = 'success' | 'cancelled' | 'network_error';

/**
 * Stands in for a real store SDK's "buy this product" call (US-066a) — purchases in this app are
 * always a local mock, never a real RevenueCat/App Store/Play integration (`CLAUDE.md`'s
 * guardrail), so a "successful" purchase just unlocks Pro locally with no money changing hands.
 * `outcome` lets a caller (in practice, only tests) exercise the cancellation/network-error paths a
 * real store call can return, so the UI's error handling can be proven without one; production
 * call sites never pass it, since a mock has nothing of its own to fail against.
 */
export async function purchasePro(
  db: SqlDatabase,
  productId: PurchaseProductId,
  outcome: MockPurchaseOutcome = 'success',
): Promise<Subscription> {
  if (outcome === 'cancelled') {
    throw new PurchaseCancelledError();
  }
  if (outcome === 'network_error') {
    throw new PurchaseNetworkError();
  }
  const product = findPurchaseProduct(productId);
  const renewsAt = new Date(Date.now() + product.durationDays * 24 * 60 * 60 * 1000).toISOString();
  return upsertSubscription(db, {
    planId: 'pro',
    status: 'active',
    productId,
    trialEndsAt: null,
    renewsAt,
  });
}

/**
 * Turns off auto-renew (US-069) — mirrors a real store's "manage subscription → cancel": nothing
 * is refunded or revoked, `renewsAt` (the already-paid period's end) is left untouched, and
 * `resolveActivePlan` keeps resolving to Pro until that date passes. A no-op if there is nothing
 * active to cancel (defensive: the UI only offers this button for an `'active'` subscription).
 */
export async function cancelSubscription(db: SqlDatabase): Promise<Subscription | null> {
  const subscription = await getSubscription(db);
  if (!subscription || subscription.status !== 'active') {
    return subscription;
  }
  return upsertSubscription(db, {
    planId: subscription.planId,
    status: 'cancelled',
    productId: subscription.productId,
    trialEndsAt: subscription.trialEndsAt,
    renewsAt: subscription.renewsAt,
  });
}

export interface RestoreResult {
  /** Whether a still-valid Pro purchase was found and is (again) in effect. */
  restored: boolean;
  subscription: Subscription | null;
}

/**
 * Stands in for a real store's "restore purchases" (US-066a) — re-querying entitlements tied to
 * the household's store account, without a new charge. This app has no account or server, so the
 * only "receipt" it can ever find is the one already on this device's local database: restoring
 * on an actual new device would need the encrypted backup/restore of Phase 17, not this mock. See
 * `progress.md` for that scope decision.
 */
export async function restorePurchases(db: SqlDatabase): Promise<RestoreResult> {
  const subscription = await getSubscription(db);
  const restored = subscription !== null && resolveActivePlan(subscription).id === PRO_PLAN.id;
  return { restored, subscription };
}
