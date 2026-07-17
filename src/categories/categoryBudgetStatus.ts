import type { CategoryBudget, Transaction } from '../db/repositories';

export interface CategoryBudgetStatus {
  /** The cap actually in effect this month, i.e. `budget.capMinor + rolloverMinor`. */
  capMinor: number;
  alertThresholdMinor: number;
  spentMinor: number;
  /** `spentMinor / capMinor * 100` (effective cap). `Infinity` when there's spend against a zero cap. */
  percentage: number;
  isOverBudget: boolean;
  /** `max(0, spentMinor - capMinor)` (effective cap). */
  overageMinor: number;
  /** Amount carried over from last month's unspent cap, or `0` when rollover is off/there's none. */
  rolloverMinor: number;
}

function spentMinorInMonth(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        transaction.categoryId === categoryId &&
        transaction.occurredAt.slice(0, 7) === monthKey,
    )
    .reduce((sum, transaction) => sum + transaction.amountMinor, 0);
}

function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  // `month` is 1-indexed (e.g. 7 for July); `Date.UTC`'s month is 0-indexed, so `month - 2`
  // steps back one calendar month (`month - 1` would be the current month itself).
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
}

/**
 * "État dépassé de X" per `docs/specs/categories-plafonds.md` — sums this month's **expenses**
 * (same convention as `computeCategoryBreakdown`) for `budget.categoryId` against its **effective**
 * cap. Pure function, no DB access: callers recompute this from already-loaded `transactions` +
 * `budget` every render, so "recalcul immédiat au changement de plafond" comes for free once the
 * caller re-fetches the budget after a save (same pattern as `computeMonthlyBalance`/
 * `computeCategoryBreakdown`).
 *
 * "Report du reste au mois suivant" (US-030): when `budget.rolloverEnabled`, the effective cap
 * adjusts by last month's leftover against the same base `capMinor` — a surplus (`capMinor` minus
 * a smaller spend) raises this month's cap, a **deficit** (last month overspent) lowers it, since
 * "le déficit est déduit du plafond du mois suivant" is as much the point as the bonus is. Clamped
 * so the effective cap itself never goes negative — a deficit can zero it out, not invert it into
 * a negative budget. **Report simple, non composé**: this only ever looks at the single
 * immediately-preceding month's spend against the same base `capMinor` — never at an
 * already-rolled-over effective cap — so leftovers can't compound across several under/over-spent
 * months in a row.
 */
export function computeCategoryBudgetStatus(
  transactions: Transaction[],
  budget: CategoryBudget,
  monthKey: string,
): CategoryBudgetStatus {
  const spentMinor = spentMinorInMonth(transactions, budget.categoryId, monthKey);

  const rolloverMinor = budget.rolloverEnabled
    ? budget.capMinor -
      spentMinorInMonth(transactions, budget.categoryId, previousMonthKey(monthKey))
    : 0;
  const capMinor = Math.max(0, budget.capMinor + rolloverMinor);

  const percentage = capMinor > 0 ? (spentMinor / capMinor) * 100 : spentMinor > 0 ? Infinity : 0;

  return {
    capMinor,
    alertThresholdMinor: budget.alertThresholdMinor,
    spentMinor,
    percentage,
    isOverBudget: spentMinor > capMinor,
    overageMinor: Math.max(0, spentMinor - capMinor),
    rolloverMinor,
  };
}
