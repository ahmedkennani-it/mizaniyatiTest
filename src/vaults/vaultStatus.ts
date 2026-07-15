import type { Vault, VaultContribution } from '../db/repositories';

export interface VaultStatus {
  savedMinor: number;
  targetMinor: number;
  /** `savedMinor / targetMinor * 100`. `Infinity` when there's savings against a zero target. */
  percentage: number;
  /** `max(0, targetMinor - savedMinor)`. */
  remainingMinor: number;
  /** `max(0, savedMinor - targetMinor)` — visible once the target is reached and more comes in. */
  surplusMinor: number;
  isReached: boolean;
  /** Whole calendar months between `now` and `deadline`, or `null` when there's no deadline or the target is already reached. */
  monthsRemaining: number | null;
  /** `remainingMinor` spread over `monthsRemaining` (at least 1 month) — `null` when there's no deadline or the target is already reached. */
  suggestedMonthlyMinor: number | null;
  /** `true` when there's a deadline in the past and the target isn't reached yet. */
  isOverdue: boolean;
}

function monthsBetween(now: Date, deadlineIso: string): number {
  const deadline = new Date(`${deadlineIso}T00:00:00.000Z`);
  return (
    (deadline.getUTCFullYear() - now.getUTCFullYear()) * 12 +
    (deadline.getUTCMonth() - now.getUTCMonth())
  );
}

/**
 * "Vue d'un coffre" per `docs/specs/objectifs-coffres.md` — sums `contributions` for `vault.id`
 * against its target. Pure function, no DB access: callers recompute this from already-loaded
 * `contributions` + `vault` every render, same pattern as `computeCategoryBudgetStatus`.
 *
 * - **Coffre sans échéance** (fonds d'urgence): `monthsRemaining`/`suggestedMonthlyMinor` stay
 *   `null` — no dated monthly suggestion is ever imposed.
 * - **Cible atteinte**: once `savedMinor >= targetMinor`, no further suggestion is computed
 *   either (there's nothing left to suggest toward) and `surplusMinor` shows the excess.
 * - **Échéance dépassée sans cible atteinte** (cas limite): `isOverdue` is `true` and
 *   `suggestedMonthlyMinor` re-suggests the entire remaining amount for "this month" rather than
 *   silently returning `null` or a negative months count.
 */
export function computeVaultStatus(
  vault: Vault,
  contributions: VaultContribution[],
  now: Date = new Date(),
): VaultStatus {
  const savedMinor = contributions
    .filter((contribution) => contribution.vaultId === vault.id)
    .reduce((sum, contribution) => sum + contribution.amountMinor, 0);

  const percentage =
    vault.targetMinor > 0 ? (savedMinor / vault.targetMinor) * 100 : savedMinor > 0 ? Infinity : 0;
  const remainingMinor = Math.max(0, vault.targetMinor - savedMinor);
  const surplusMinor = Math.max(0, savedMinor - vault.targetMinor);
  const isReached = vault.targetMinor > 0 && savedMinor >= vault.targetMinor;

  const base = {
    savedMinor,
    targetMinor: vault.targetMinor,
    percentage,
    remainingMinor,
    surplusMinor,
    isReached,
  };

  if (!vault.deadline || isReached) {
    return { ...base, monthsRemaining: null, suggestedMonthlyMinor: null, isOverdue: false };
  }

  const rawMonthsRemaining = monthsBetween(now, vault.deadline);
  const isOverdue = rawMonthsRemaining <= 0;
  const monthsRemaining = Math.max(1, rawMonthsRemaining);

  return {
    ...base,
    monthsRemaining,
    suggestedMonthlyMinor: Math.ceil(remainingMinor / monthsRemaining),
    isOverdue,
  };
}
