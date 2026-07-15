import type { Category, Transaction, TransactionType } from '../../db/repositories';
import { computeCategoryBreakdown } from '../categoryBreakdown';

let nextId = 0;

function makeTransaction(
  type: TransactionType,
  amountMinor: number,
  occurredAt: string,
  categoryId: string,
): Transaction {
  nextId += 1;
  return {
    id: `tx-${nextId}`,
    type,
    amountMinor,
    currencyCode: 'MAD',
    categoryId,
    memberId: 'member-1',
    occurredAt,
    note: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

function makeCategory(id: string, name: string): Category {
  return {
    id,
    name,
    icon: 'ellipsis',
    color: '#000000',
    isDefault: false,
    orderIndex: 0,
    seasonalThemeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const categories = [makeCategory('cat-courses', 'Courses'), makeCategory('cat-transport', 'Transport')];

describe('computeCategoryBreakdown', () => {
  it('returns an empty list when there are no expenses', () => {
    expect(computeCategoryBreakdown([], categories, '2026-07')).toEqual([]);
  });

  it('sums expenses per category and sorts by total descending', () => {
    const transactions = [
      makeTransaction('expense', 5000, '2026-07-05T10:00:00.000Z', 'cat-transport'),
      makeTransaction('expense', 12000, '2026-07-01T10:00:00.000Z', 'cat-courses'),
      makeTransaction('expense', 3000, '2026-07-10T10:00:00.000Z', 'cat-courses'),
    ];

    const breakdown = computeCategoryBreakdown(transactions, categories, '2026-07');

    expect(breakdown).toEqual([
      { categoryId: 'cat-courses', categoryName: 'Courses', totalMinor: 15000 },
      { categoryId: 'cat-transport', categoryName: 'Transport', totalMinor: 5000 },
    ]);
  });

  it('excludes income transactions (répartition = où part l\'argent)', () => {
    const transactions = [
      makeTransaction('income', 500000, '2026-07-01T09:00:00.000Z', 'cat-courses'),
      makeTransaction('expense', 2000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
    ];

    const breakdown = computeCategoryBreakdown(transactions, categories, '2026-07');

    expect(breakdown).toEqual([{ categoryId: 'cat-courses', categoryName: 'Courses', totalMinor: 2000 }]);
  });

  it('ignores transactions from a different month', () => {
    const transactions = [
      makeTransaction('expense', 9000, '2026-06-30T10:00:00.000Z', 'cat-courses'),
      makeTransaction('expense', 1000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
    ];

    const breakdown = computeCategoryBreakdown(transactions, categories, '2026-07');

    expect(breakdown).toEqual([{ categoryId: 'cat-courses', categoryName: 'Courses', totalMinor: 1000 }]);
  });
});
