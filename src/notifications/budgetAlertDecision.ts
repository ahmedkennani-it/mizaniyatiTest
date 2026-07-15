import type { CategoryBudgetStatus } from '../categories';

/**
 * Fixed MVP "heures calmes" window (local device time, 22h–7h) — not user-configurable yet, same
 * "placeholder until a real story needs it" reasoning as `freePlan.ts`'s entitlement numbers.
 * Wraps past midnight (`startHour > endHour`).
 */
export const QUIET_HOURS = { startHour: 22, endHour: 7 };

export function isWithinQuietHours(now: Date, quietHours = QUIET_HOURS): boolean {
  const hour = now.getHours();
  if (quietHours.startHour > quietHours.endHour) {
    return hour >= quietHours.startHour || hour < quietHours.endHour;
  }
  return hour >= quietHours.startHour && hour < quietHours.endHour;
}

export interface BudgetAlertDecisionInput {
  /** Whether the user opted in to budget-alert notifications (off by default). */
  enabled: boolean;
  now: Date;
  budgetStatus: CategoryBudgetStatus;
  /** Whether a budget alert was already sent for this category this month. */
  alreadyAlertedThisMonth: boolean;
}

/**
 * Whether to actually send a "cumul atteint le seuil" notification for a category, per
 * `docs/specs/categories-plafonds.md`. Pure decision function — callers gather `enabled` (from
 * `notificationSettingsRepository`), `alreadyAlertedThisMonth` (from `CategoryBudget.lastAlertedMonth`)
 * and `budgetStatus` (from `computeCategoryBudgetStatus`) and pass them in. Note this only gates
 * the **notification** — the "état visuel dépassé" badge (`CategoriesScreen`, US-018) is computed
 * from `budgetStatus` directly and always shows regardless of this decision.
 */
export function shouldSendBudgetAlert(input: BudgetAlertDecisionInput): boolean {
  if (!input.enabled) {
    return false;
  }
  if (input.alreadyAlertedThisMonth) {
    return false;
  }
  if (isWithinQuietHours(input.now)) {
    return false;
  }
  return input.budgetStatus.spentMinor >= input.budgetStatus.alertThresholdMinor;
}
