import type { Category, Transaction, TransactionType } from '../../db/repositories';
import { rankCategoriesByFrequency } from '../categoryFrequency';

const NOW = new Date('2026-07-17T10:00:00.000Z');

let nextId = 0;

function makeCategory(id: string, orderIndex: number): Category {
  return {
    id,
    name: id,
    icon: 'cart',
    color: '#111111',
    isDefault: false,
    orderIndex,
    seasonalThemeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeTransaction(
  categoryId: string,
  occurredAt: string,
  type: TransactionType = 'expense',
): Transaction {
  nextId += 1;
  return {
    id: `tx-${nextId}`,
    type,
    amountMinor: 1000,
    currencyCode: 'MAD',
    categoryId,
    memberId: 'member-1',
    occurredAt,
    note: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

/** `daysAgo` days before `NOW`, as the ISO instant a transaction would carry. */
function daysBeforeNow(daysAgo: number): string {
  return new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

const courses = makeCategory('courses', 0);
const ecole = makeCategory('ecole', 1);
const transport = makeCategory('transport', 2);

function rankedIds(categories: Category[], transactions: Transaction[]): string[] {
  return rankCategoriesByFrequency(categories, transactions, NOW).map((category) => category.id);
}

describe('rankCategoriesByFrequency', () => {
  it('falls back to the default order when there is no history', () => {
    expect(rankedIds([transport, courses, ecole], [])).toEqual(['courses', 'ecole', 'transport']);
  });

  it('puts the most-used category first', () => {
    const transactions = [
      makeTransaction('transport', daysBeforeNow(1)),
      makeTransaction('transport', daysBeforeNow(2)),
      makeTransaction('transport', daysBeforeNow(3)),
      makeTransaction('ecole', daysBeforeNow(4)),
      makeTransaction('ecole', daysBeforeNow(5)),
    ];

    expect(rankedIds([courses, ecole, transport], transactions)).toEqual([
      'transport',
      'ecole',
      'courses',
    ]);
  });

  /**
   * The point of the 30-day window: a category the household has moved on from stops crowding the
   * strip, however heavily it was used before.
   */
  it('ignores usage older than the 30-day window', () => {
    const transactions = [
      makeTransaction('ecole', daysBeforeNow(31)),
      makeTransaction('ecole', daysBeforeNow(60)),
      makeTransaction('ecole', daysBeforeNow(90)),
      makeTransaction('courses', daysBeforeNow(29)),
    ];

    expect(rankedIds([courses, ecole, transport], transactions)).toEqual([
      'courses',
      'ecole',
      'transport',
    ]);
  });

  it('counts usage on the window boundary', () => {
    const onTheEdge = [makeTransaction('transport', daysBeforeNow(30))];

    expect(rankedIds([courses, ecole, transport], onTheEdge)[0]).toBe('transport');
  });

  /**
   * Ranking by count, not by amount: the chips answer "what do I tap most often". A single large
   * rent payment must not outrank a category used every other day.
   */
  it('ranks by number of uses, not by amount spent', () => {
    const transactions = [
      { ...makeTransaction('ecole', daysBeforeNow(1)), amountMinor: 800000 },
      makeTransaction('courses', daysBeforeNow(2)),
      makeTransaction('courses', daysBeforeNow(3)),
    ];

    expect(rankedIds([courses, ecole, transport], transactions)[0]).toBe('courses');
  });

  it('counts income alongside expenses (one shared category set)', () => {
    const transactions = [
      makeTransaction('transport', daysBeforeNow(1), 'income'),
      makeTransaction('transport', daysBeforeNow(2), 'income'),
      makeTransaction('courses', daysBeforeNow(3), 'expense'),
    ];

    expect(rankedIds([courses, ecole, transport], transactions)[0]).toBe('transport');
  });

  /**
   * `occurredAt` is midnight UTC of the chosen day while `now` is a real instant, so in any
   * timezone ahead of UTC a transaction entered early today is already "in the future". It has to
   * keep counting for its own category.
   */
  it('counts a future-dated transaction', () => {
    const tomorrow = [makeTransaction('transport', daysBeforeNow(-1))];

    expect(rankedIds([courses, ecole, transport], tomorrow)[0]).toBe('transport');
  });

  it('breaks ties on the default order', () => {
    const transactions = [
      makeTransaction('transport', daysBeforeNow(1)),
      makeTransaction('courses', daysBeforeNow(2)),
    ];

    expect(rankedIds([transport, ecole, courses], transactions)).toEqual([
      'courses',
      'transport',
      'ecole',
    ]);
  });

  it('leaves the caller’s array untouched', () => {
    const categories = [courses, ecole, transport];

    rankCategoriesByFrequency(categories, [makeTransaction('transport', daysBeforeNow(1))], NOW);

    expect(categories.map((category) => category.id)).toEqual(['courses', 'ecole', 'transport']);
  });
});
