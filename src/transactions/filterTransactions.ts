import type { Transaction } from '../db/repositories';

export type TransactionTypeFilter = 'all' | 'expense' | 'income';

export interface TransactionFilters {
  type: TransactionTypeFilter;
  /** `null` means every category. */
  categoryId: string | null;
  /** `null` means every member. */
  memberId: string | null;
}

export const NO_FILTERS: TransactionFilters = { type: 'all', categoryId: null, memberId: null };

/**
 * Narrows the full history (US-012). Pure, and deliberately not month-scoped: this is the list
 * behind "Voir tout", whose whole point is the history the month-scoped dashboard hides.
 *
 * Filters combine with AND — picking a member *and* a category means transactions matching both,
 * which is what someone answering "how much did Salma spend on groceries" is asking.
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    if (filters.categoryId !== null && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.memberId !== null && transaction.memberId !== filters.memberId) {
      return false;
    }
    return true;
  });
}
