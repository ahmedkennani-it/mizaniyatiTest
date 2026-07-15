import type { Category, Transaction } from '../db/repositories';

export interface CategoryBreakdownEntry {
  categoryId: string;
  categoryName: string;
  totalMinor: number;
}

/**
 * "Répartition par catégorie" per `docs/specs/dashboard.md`: totals **expenses only** ("où part
 * l'argent" — incomes don't belong in a spending breakdown) for `monthKey` (`YYYY-MM`), grouped by
 * category and sorted by total descending. Pure function, no DB access, same single-currency
 * assumption as `computeMonthlyBalance`.
 */
export function computeCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
): CategoryBreakdownEntry[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totalsByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || transaction.occurredAt.slice(0, 7) !== monthKey) {
      continue;
    }
    totalsByCategory.set(
      transaction.categoryId,
      (totalsByCategory.get(transaction.categoryId) ?? 0) + transaction.amountMinor,
    );
  }

  return [...totalsByCategory.entries()]
    .map(([categoryId, totalMinor]) => ({
      categoryId,
      categoryName: categoryById.get(categoryId)?.name ?? categoryId,
      totalMinor,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);
}
