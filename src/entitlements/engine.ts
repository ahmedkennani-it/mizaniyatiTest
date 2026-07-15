import type { Plan } from './types';

export interface EntitlementsEngine {
  plan: Plan;
  /** Whether a boolean feature (e.g. `'tontine'`) is unlocked by the current plan. */
  can(featureKey: string): boolean;
  /** The numeric limit (e.g. `'categories.max'`) granted by the current plan; `0` if unset. */
  limit(limitKey: string): number;
}

/**
 * Reads entitlements from the given plan. Feature code must always call `can`/`limit` instead of
 * hardcoding a number or boolean — swapping the plan (Pro, or an admin-updated free tier) then
 * changes behavior with no code change, per `.claude/rules` and `docs/specs/plans-abonnements.md`.
 */
export function createEntitlementsEngine(plan: Plan): EntitlementsEngine {
  function find(key: string) {
    return plan.entitlements.find((entitlement) => entitlement.key === key);
  }

  return {
    plan,
    can(featureKey) {
      return find(featureKey)?.booleanValue ?? false;
    },
    limit(limitKey) {
      return find(limitKey)?.numericValue ?? 0;
    },
  };
}
