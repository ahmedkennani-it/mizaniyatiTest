import { FREE_PLAN, PRO_PLAN } from '../entitlements';
import type { Plan } from '../entitlements';
import type { Subscription } from '../db/repositories';

/**
 * Which `Plan`'s entitlements currently apply, per `docs/specs/plans-abonnements.md`'s GWT
 * criteria — pure function, no DB access, recomputed from an already-loaded `Subscription` (or
 * `null` for "never subscribed") every time, same recompute-don't-cache pattern as
 * `computeMonthlyBalance`/`computeCategoryBudgetStatus`.
 *
 * - No subscription row → free plan.
 * - `'trial'` with `trialEndsAt` in the future → Pro (the whole point of a trial).
 * - `'trial'` with `trialEndsAt` in the past → free plan ("Given un abonnement expiré... je
 *   repasse aux entitlements gratuits, données conservées" — this never deletes anything, it just
 *   changes which `Plan` object the entitlements engine reads).
 * - `'active'` → Pro (a real recurring purchase; not reachable via any UI in this app yet since no
 *   in-app-purchase integration exists, but the state is modeled for when it does).
 * - `'expired'` → free plan.
 */
export function resolveActivePlan(subscription: Subscription | null, now: Date = new Date()): Plan {
  if (!subscription) {
    return FREE_PLAN;
  }
  if (subscription.status === 'trial') {
    const stillTrialing = subscription.trialEndsAt !== null && new Date(subscription.trialEndsAt) > now;
    return stillTrialing ? PRO_PLAN : FREE_PLAN;
  }
  if (subscription.status === 'active') {
    return PRO_PLAN;
  }
  return FREE_PLAN;
}
