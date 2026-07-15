import type { CategoryBudget, Transaction, TransactionType } from '../../db/repositories';
import { computeCategoryBudgetStatus } from '../categoryBudgetStatus';

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

function makeBudget(overrides: Partial<CategoryBudget> = {}): CategoryBudget {
  return {
    id: 'budget-1',
    categoryId: 'cat-courses',
    month: '2026-07',
    capMinor: 100000,
    alertThresholdMinor: 80000,
    lastAlertedMonth: null,
    rolloverEnabled: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeCategoryBudgetStatus', () => {
  it('reports 0% and no overage when nothing was spent', () => {
    const status = computeCategoryBudgetStatus([], makeBudget(), '2026-07');
    expect(status).toEqual({
      capMinor: 100000,
      alertThresholdMinor: 80000,
      spentMinor: 0,
      percentage: 0,
      isOverBudget: false,
      overageMinor: 0,
      rolloverMinor: 0,
    });
  });

  it('computes the percentage of the cap consumed while under budget', () => {
    const transactions = [
      makeTransaction('expense', 45000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
    ];

    const status = computeCategoryBudgetStatus(transactions, makeBudget(), '2026-07');

    expect(status.spentMinor).toBe(45000);
    expect(status.percentage).toBe(45);
    expect(status.isOverBudget).toBe(false);
    expect(status.overageMinor).toBe(0);
  });

  it('marks "dépassé de X" once spending exceeds the cap (% > 100)', () => {
    const transactions = [
      makeTransaction('expense', 130000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
    ];

    const status = computeCategoryBudgetStatus(transactions, makeBudget(), '2026-07');

    expect(status.percentage).toBe(130);
    expect(status.isOverBudget).toBe(true);
    expect(status.overageMinor).toBe(30000);
  });

  it('excludes income and other categories/months from the spent total', () => {
    const transactions = [
      makeTransaction('income', 500000, '2026-07-01T09:00:00.000Z', 'cat-courses'),
      makeTransaction('expense', 9000, '2026-06-30T10:00:00.000Z', 'cat-courses'),
      makeTransaction('expense', 5000, '2026-07-02T10:00:00.000Z', 'cat-transport'),
      makeTransaction('expense', 20000, '2026-07-03T10:00:00.000Z', 'cat-courses'),
    ];

    const status = computeCategoryBudgetStatus(transactions, makeBudget(), '2026-07');

    expect(status.spentMinor).toBe(20000);
  });

  it('recomputes immediately against a newly edited cap (no stale state)', () => {
    const transactions = [
      makeTransaction('expense', 90000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
    ];

    const before = computeCategoryBudgetStatus(
      transactions,
      makeBudget({ capMinor: 100000 }),
      '2026-07',
    );
    expect(before.isOverBudget).toBe(false);

    const after = computeCategoryBudgetStatus(
      transactions,
      makeBudget({ capMinor: 80000 }),
      '2026-07',
    );
    expect(after.isOverBudget).toBe(true);
    expect(after.overageMinor).toBe(10000);
  });

  describe('report du reste au mois suivant (US-020)', () => {
    it('does not add any rollover when disabled, even with a positive leftover last month', () => {
      const transactions = [
        makeTransaction('expense', 40000, '2026-06-10T10:00:00.000Z', 'cat-courses'),
      ];

      const status = computeCategoryBudgetStatus(
        transactions,
        makeBudget({ rolloverEnabled: false }),
        '2026-07',
      );

      expect(status.rolloverMinor).toBe(0);
      expect(status.capMinor).toBe(100000);
    });

    it("adds last month's positive leftover to this month's effective cap when enabled", () => {
      const transactions = [
        makeTransaction('expense', 40000, '2026-06-10T10:00:00.000Z', 'cat-courses'),
      ];
      const budget = makeBudget({ rolloverEnabled: true, capMinor: 100000 });

      const status = computeCategoryBudgetStatus(transactions, budget, '2026-07');

      // Leftover = 100000 (cap) - 40000 (spent in June) = 60000, added on top of July's own cap.
      expect(status.rolloverMinor).toBe(60000);
      expect(status.capMinor).toBe(160000);
    });

    it('does not roll over a negative leftover (last month already over budget)', () => {
      const transactions = [
        makeTransaction('expense', 130000, '2026-06-10T10:00:00.000Z', 'cat-courses'),
      ];
      const budget = makeBudget({ rolloverEnabled: true, capMinor: 100000 });

      const status = computeCategoryBudgetStatus(transactions, budget, '2026-07');

      expect(status.rolloverMinor).toBe(0);
      expect(status.capMinor).toBe(100000);
    });

    it('is a simple, non-compounding rollover: only the immediately preceding month counts', () => {
      const transactions = [
        // May: fully unspent (would-be leftover irrelevant — never looked at).
        // June: 40000 spent, so June's own leftover (60000) is what rolls into July.
        makeTransaction('expense', 40000, '2026-06-10T10:00:00.000Z', 'cat-courses'),
      ];
      const budget = makeBudget({ rolloverEnabled: true, capMinor: 100000 });

      const july = computeCategoryBudgetStatus(transactions, budget, '2026-07');

      // July's rollover is based on June's spend against the plain configured cap (100000), not
      // on some inflated "June effective cap" — so it can't compound across several months.
      expect(july.rolloverMinor).toBe(60000);
    });

    it('recomputes the effective cap for percentage/overage, not just the raw cap', () => {
      const transactions = [
        makeTransaction('expense', 40000, '2026-06-10T10:00:00.000Z', 'cat-courses'),
        makeTransaction('expense', 150000, '2026-07-05T10:00:00.000Z', 'cat-courses'),
      ];
      const budget = makeBudget({ rolloverEnabled: true, capMinor: 100000 });

      const status = computeCategoryBudgetStatus(transactions, budget, '2026-07');

      // Effective cap = 100000 + 60000 rollover = 160000; spent 150000 stays under it.
      expect(status.capMinor).toBe(160000);
      expect(status.isOverBudget).toBe(false);
      expect(status.percentage).toBeCloseTo((150000 / 160000) * 100);
    });
  });
});
