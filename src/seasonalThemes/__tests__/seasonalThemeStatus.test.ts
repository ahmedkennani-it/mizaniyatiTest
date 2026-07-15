import type { Category, SeasonalTheme, Transaction } from '../../db/repositories';
import { computeSeasonalThemeStatus } from '../seasonalThemeStatus';

function makeTheme(overrides: Partial<SeasonalTheme> = {}): SeasonalTheme {
  return {
    id: 'theme-1',
    type: 'ramadan',
    active: true,
    startDate: '2027-03-01',
    endDate: '2027-03-30',
    envelopeMinor: 750000,
    currencyCode: 'MAD',
    createdAt: '2027-02-01T00:00:00.000Z',
    updatedAt: '2027-02-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Iftar & Suhoor',
    icon: 'utensils',
    color: '#0D9488',
    isDefault: false,
    orderIndex: 0,
    seasonalThemeId: 'theme-1',
    createdAt: '2027-02-01T00:00:00.000Z',
    updatedAt: '2027-02-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amountMinor: 10000,
    currencyCode: 'MAD',
    categoryId: 'cat-1',
    memberId: 'member-1',
    occurredAt: '2027-03-10T10:00:00.000Z',
    note: null,
    createdAt: '2027-03-10T10:00:00.000Z',
    updatedAt: '2027-03-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('computeSeasonalThemeStatus', () => {
  it('sums only expense transactions in the theme categories', () => {
    const theme = makeTheme();
    const categories = [makeCategory({ id: 'cat-1' })];
    const transactions = [
      makeTransaction({ categoryId: 'cat-1', amountMinor: 20000 }),
      makeTransaction({ categoryId: 'cat-1', amountMinor: 5000, type: 'income' }), // ignored: income
      makeTransaction({ categoryId: 'other-category', amountMinor: 999999 }), // ignored: not a theme category
    ];

    const status = computeSeasonalThemeStatus(
      theme,
      categories,
      transactions,
      new Date('2027-03-15T00:00:00.000Z'),
    );

    expect(status.spentMinor).toBe(20000);
    expect(status.remainingMinor).toBe(750000 - 20000);
  });

  it('signals a negative remainder without erroring when the envelope is exceeded', () => {
    const theme = makeTheme({ envelopeMinor: 10000 });
    const categories = [makeCategory({ id: 'cat-1' })];
    const transactions = [makeTransaction({ categoryId: 'cat-1', amountMinor: 15000 })];

    const status = computeSeasonalThemeStatus(
      theme,
      categories,
      transactions,
      new Date('2027-03-15T00:00:00.000Z'),
    );

    expect(status.remainingMinor).toBe(-5000);
  });

  it('computes days remaining until the end date', () => {
    const theme = makeTheme({ endDate: '2027-03-30' });

    const status = computeSeasonalThemeStatus(theme, [], [], new Date('2027-03-25T00:00:00.000Z'));

    // Inclusive of both the 25th and the 30th (end of day) — 6 calendar days remain.
    expect(status.daysRemaining).toBe(6);
    expect(status.isEnded).toBe(false);
  });

  it('marks the theme ended once the end date has passed, with zero days remaining', () => {
    const theme = makeTheme({ endDate: '2027-03-30' });

    const status = computeSeasonalThemeStatus(theme, [], [], new Date('2027-04-05T00:00:00.000Z'));

    expect(status.isEnded).toBe(true);
    expect(status.daysRemaining).toBe(0);
  });

  it('breaks spend down per sub-category', () => {
    const theme = makeTheme();
    const categories = [
      makeCategory({ id: 'cat-1', name: 'Iftar & Suhoor' }),
      makeCategory({ id: 'cat-2', name: 'Zakat al-Fitr' }),
    ];
    const transactions = [
      makeTransaction({ categoryId: 'cat-1', amountMinor: 10000 }),
      makeTransaction({ categoryId: 'cat-2', amountMinor: 25000 }),
    ];

    const status = computeSeasonalThemeStatus(
      theme,
      categories,
      transactions,
      new Date('2027-03-15T00:00:00.000Z'),
    );

    expect(status.categorySpend).toEqual([
      { category: categories[0], spentMinor: 10000 },
      { category: categories[1], spentMinor: 25000 },
    ]);
  });

  it('only includes theme-category expenses from the last 7 days in the weekly list', () => {
    const theme = makeTheme();
    const categories = [makeCategory({ id: 'cat-1' })];
    const transactions = [
      makeTransaction({
        id: 'recent',
        categoryId: 'cat-1',
        occurredAt: '2027-03-14T00:00:00.000Z',
      }),
      makeTransaction({ id: 'old', categoryId: 'cat-1', occurredAt: '2027-03-01T00:00:00.000Z' }),
    ];

    const status = computeSeasonalThemeStatus(
      theme,
      categories,
      transactions,
      new Date('2027-03-15T00:00:00.000Z'),
    );

    expect(status.weeklyTransactions.map((t) => t.id)).toEqual(['recent']);
  });
});
