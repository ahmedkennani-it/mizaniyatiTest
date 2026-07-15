import type { Transaction, TransactionType } from '../../db/repositories';
import { computeMonthlyBalance } from '../monthlyBalance';

let nextId = 0;

function makeTransaction(
  type: TransactionType,
  amountMinor: number,
  occurredAt: string,
): Transaction {
  nextId += 1;
  return {
    id: `tx-${nextId}`,
    type,
    amountMinor,
    currencyCode: 'MAD',
    categoryId: 'category-1',
    memberId: 'member-1',
    occurredAt,
    note: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

describe('computeMonthlyBalance', () => {
  it('returns 0 for an empty list', () => {
    expect(computeMonthlyBalance([], '2026-07')).toBe(0);
  });

  it('subtracts an expense from the balance', () => {
    const transactions = [makeTransaction('expense', 5000, '2026-07-05T10:00:00.000Z')];
    expect(computeMonthlyBalance(transactions, '2026-07')).toBe(-5000);
  });

  it('adds an income to the balance (US-011: un revenu augmente le solde du mois)', () => {
    const transactions = [makeTransaction('income', 500000, '2026-07-01T09:00:00.000Z')];
    expect(computeMonthlyBalance(transactions, '2026-07')).toBe(500000);
  });

  it('nets income and expenses together for the month', () => {
    const transactions = [
      makeTransaction('income', 500000, '2026-07-01T09:00:00.000Z'),
      makeTransaction('expense', 12000, '2026-07-05T10:00:00.000Z'),
      makeTransaction('expense', 3000, '2026-07-20T10:00:00.000Z'),
    ];
    expect(computeMonthlyBalance(transactions, '2026-07')).toBe(500000 - 12000 - 3000);
  });

  it('ignores transactions from a different month', () => {
    const transactions = [
      makeTransaction('income', 500000, '2026-06-30T09:00:00.000Z'),
      makeTransaction('expense', 12000, '2026-07-05T10:00:00.000Z'),
    ];
    expect(computeMonthlyBalance(transactions, '2026-07')).toBe(-12000);
  });

  it('can go negative when expenses exceed income', () => {
    const transactions = [
      makeTransaction('income', 1000, '2026-07-01T09:00:00.000Z'),
      makeTransaction('expense', 5000, '2026-07-05T10:00:00.000Z'),
    ];
    expect(computeMonthlyBalance(transactions, '2026-07')).toBe(-4000);
  });
});
