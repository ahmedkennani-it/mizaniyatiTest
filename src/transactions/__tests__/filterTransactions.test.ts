import type { Transaction } from '../../db/repositories';
import { NO_FILTERS, filterTransactions } from '../filterTransactions';

function transaction(
  id: string,
  type: 'expense' | 'income',
  categoryId: string,
  memberId: string,
): Transaction {
  return {
    id,
    type,
    amountMinor: 1000,
    currencyCode: 'MAD',
    categoryId,
    memberId,
    occurredAt: '2026-07-05T10:00:00.000Z',
    note: null,
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T10:00:00.000Z',
  };
}

const ALL = [
  transaction('a', 'expense', 'courses', 'salma'),
  transaction('b', 'expense', 'transport', 'youssef'),
  transaction('c', 'income', 'salaire', 'youssef'),
  transaction('d', 'expense', 'courses', 'youssef'),
];

const ids = (list: Transaction[]) => list.map((t) => t.id);

describe('filterTransactions (US-012)', () => {
  it('returns everything with no filters', () => {
    expect(filterTransactions(ALL, NO_FILTERS)).toEqual(ALL);
  });

  it('keeps only expenses', () => {
    expect(ids(filterTransactions(ALL, { ...NO_FILTERS, type: 'expense' }))).toEqual(['a', 'b', 'd']);
  });

  it('keeps only income', () => {
    expect(ids(filterTransactions(ALL, { ...NO_FILTERS, type: 'income' }))).toEqual(['c']);
  });

  it('filters by category', () => {
    expect(ids(filterTransactions(ALL, { ...NO_FILTERS, categoryId: 'courses' }))).toEqual([
      'a',
      'd',
    ]);
  });

  it('filters by member', () => {
    expect(ids(filterTransactions(ALL, { ...NO_FILTERS, memberId: 'salma' }))).toEqual(['a']);
  });

  /** "How much did Youssef spend on groceries" is an AND, not an OR. */
  it('combines filters with AND', () => {
    expect(
      ids(filterTransactions(ALL, { type: 'expense', categoryId: 'courses', memberId: 'youssef' })),
    ).toEqual(['d']);
  });

  it('returns nothing when the combination matches nothing', () => {
    expect(filterTransactions(ALL, { ...NO_FILTERS, type: 'income', memberId: 'salma' })).toEqual(
      [],
    );
  });

  it('never mutates the list it is handed', () => {
    const copy = [...ALL];
    filterTransactions(ALL, { ...NO_FILTERS, type: 'income' });
    expect(ALL).toEqual(copy);
  });

  it('handles an empty history', () => {
    expect(filterTransactions([], NO_FILTERS)).toEqual([]);
  });
});
