import type { Debt, DebtRepayment } from '../../db/repositories';
import { computeDebtStatus, computeNetDebtTotals } from '../computeDebtStatus';

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    label: 'Prêt',
    counterparty: 'Salma',
    direction: 'owed_to_household',
    amountMinor: 30000,
    currencyCode: 'MAD',
    date: '2026-03-01',
    dueDate: null,
    settled: false,
    remindedAt: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function repayment(overrides: Partial<DebtRepayment> = {}): DebtRepayment {
  return {
    id: 'repayment-1',
    debtId: 'debt-1',
    amountMinor: 10000,
    date: '2026-04-01',
    createdAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeDebtStatus', () => {
  it('is fully outstanding with no repayments', () => {
    const status = computeDebtStatus(debt(), []);
    expect(status).toEqual({ repaidMinor: 0, remainingMinor: 30000, isSettled: false });
  });

  it('reduces the remaining amount by partial repayments', () => {
    const status = computeDebtStatus(debt(), [repayment({ amountMinor: 10000 })]);
    expect(status).toEqual({ repaidMinor: 10000, remainingMinor: 20000, isSettled: false });
  });

  it('is settled once repayments cover the full amount', () => {
    const status = computeDebtStatus(debt(), [
      repayment({ id: 'r1', amountMinor: 10000 }),
      repayment({ id: 'r2', amountMinor: 20000 }),
    ]);
    expect(status).toEqual({ repaidMinor: 30000, remainingMinor: 0, isSettled: true });
  });

  it('never goes negative when overpaid', () => {
    const status = computeDebtStatus(debt(), [repayment({ amountMinor: 40000 })]);
    expect(status.remainingMinor).toBe(0);
    expect(status.isSettled).toBe(true);
  });

  it('ignores repayments belonging to a different debt', () => {
    const status = computeDebtStatus(debt(), [repayment({ debtId: 'other-debt' })]);
    expect(status).toEqual({ repaidMinor: 0, remainingMinor: 30000, isSettled: false });
  });

  it('never reads the legacy settled column', () => {
    const status = computeDebtStatus(debt({ settled: true }), []);
    expect(status.isSettled).toBe(false);
  });
});

describe('computeNetDebtTotals', () => {
  it('sums "on me doit" and "je dois" separately', () => {
    const debts = [
      debt({ id: 'd1', direction: 'owed_to_household', amountMinor: 30000 }),
      debt({ id: 'd2', direction: 'household_owes', amountMinor: 12000 }),
    ];

    expect(computeNetDebtTotals(debts, [])).toEqual({
      owedToHouseholdMinor: 30000,
      householdOwesMinor: 12000,
    });
  });

  it('excludes a settled debt from the totals', () => {
    const debts = [debt({ id: 'd1', direction: 'owed_to_household', amountMinor: 30000 })];
    const repayments = [repayment({ debtId: 'd1', amountMinor: 30000 })];

    expect(computeNetDebtTotals(debts, repayments)).toEqual({
      owedToHouseholdMinor: 0,
      householdOwesMinor: 0,
    });
  });

  it('counts only the remaining balance of a partially repaid debt', () => {
    const debts = [debt({ id: 'd1', direction: 'household_owes', amountMinor: 30000 })];
    const repayments = [repayment({ debtId: 'd1', amountMinor: 10000 })];

    expect(computeNetDebtTotals(debts, repayments).householdOwesMinor).toBe(20000);
  });

  it('returns zero totals with no debts', () => {
    expect(computeNetDebtTotals([], [])).toEqual({
      owedToHouseholdMinor: 0,
      householdOwesMinor: 0,
    });
  });
});
