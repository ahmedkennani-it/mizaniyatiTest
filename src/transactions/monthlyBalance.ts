import type { Transaction } from '../db/repositories';

/**
 * "Solde du mois" per `docs/specs/dashboard.md`: incomes minus expenses for the transactions that
 * occurred in `monthKey` (a `YYYY-MM` string, e.g. `"2026-07"`), in minor currency units. Callers
 * are responsible for passing transactions that share a single currency — this deliberately
 * doesn't convert between currencies (per `.claude/rules/i18n-rtl-money.md`), matching the
 * spec's "ne pas additionner des devises différentes sans conversion indicative" edge case.
 */
export function computeMonthlyBalance(transactions: Transaction[], monthKey: string): number {
  return transactions
    .filter((transaction) => transaction.occurredAt.slice(0, 7) === monthKey)
    .reduce(
      (balance, transaction) =>
        balance +
        (transaction.type === 'income' ? transaction.amountMinor : -transaction.amountMinor),
      0,
    );
}
