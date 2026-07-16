import type { Category, Transaction } from '../db/repositories';

/** "ordonnées par fréquence d'usage sur 30 jours" (US-017). */
export const FREQUENCY_WINDOW_DAYS = 30;

/**
 * Orders `categories` by how often they were used over the last `windowDays`, most-used first.
 * Pure function, no DB access — the caller ranks from already-loaded rows, same pattern as
 * `computeCategoryBudgetStatus`.
 *
 * **Frequency, not amount**: a category used for six 20 MAD coffees ranks above one used for a
 * single 8 000 MAD rent payment. The chips answer "what do I tap most often", which is what makes
 * the common case a single tap; ranking by spend would sort the strip by the transactions the user
 * enters *least*.
 *
 * Counts every transaction type rather than expenses only: the picker serves both the expense and
 * the income form, off one shared category set.
 *
 * The window has a lower bound but **no upper bound**. A future-dated transaction still counts —
 * dropping one would cost more than it buys, since `occurredAt` is stored as midnight UTC of the
 * chosen day while "now" is a real local instant: in any timezone ahead of UTC, a transaction
 * entered early today is already "in the future" and would vanish from its own category's count.
 *
 * Ties (including everything unused, all tied at zero) fall back to `orderIndex`, so the strip
 * opens on the intended default order for a household that has no history yet.
 */
export function rankCategoriesByFrequency(
  categories: Category[],
  transactions: Transaction[],
  now: Date,
  windowDays: number = FREQUENCY_WINDOW_DAYS,
): Category[] {
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const usesByCategoryId = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.occurredAt < cutoff) {
      continue;
    }
    usesByCategoryId.set(
      transaction.categoryId,
      (usesByCategoryId.get(transaction.categoryId) ?? 0) + 1,
    );
  }

  return [...categories].sort((left, right) => {
    const byUses = (usesByCategoryId.get(right.id) ?? 0) - (usesByCategoryId.get(left.id) ?? 0);
    return byUses !== 0 ? byUses : left.orderIndex - right.orderIndex;
  });
}
