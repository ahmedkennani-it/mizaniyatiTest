import type { Debt, DebtRepayment } from '../db/repositories';

export interface DebtStatus {
  repaidMinor: number;
  remainingMinor: number;
  /** `remainingMinor <= 0` — the only source of truth for "Soldée" (US-050), never a stored flag. */
  isSettled: boolean;
}

/**
 * Sums `repayments` for `debt.id` against its original `amountMinor` (US-050). Pure, no DB
 * access — same pattern as `computeVaultStatus`. `Debt.settled` (a legacy column from task 1.3) is
 * never read here: a debt is settled exactly when its repayments cover it, nothing else.
 */
export function computeDebtStatus(debt: Debt, repayments: DebtRepayment[]): DebtStatus {
  const repaidMinor = repayments
    .filter((repayment) => repayment.debtId === debt.id)
    .reduce((sum, repayment) => sum + repayment.amountMinor, 0);
  const remainingMinor = Math.max(0, debt.amountMinor - repaidMinor);
  return { repaidMinor, remainingMinor, isSettled: remainingMinor <= 0 };
}

export interface NetDebtTotals {
  /** "On me doit" — unsettled debts where the household is the lender. */
  owedToHouseholdMinor: number;
  /** "Je dois" — unsettled debts where the household is the borrower. */
  householdOwesMinor: number;
}

/**
 * The two headline totals of US-048's "vue nette" — a settled debt (fully repaid) never
 * contributes to either total, per US-050's "elle... sort des totaux".
 */
export function computeNetDebtTotals(debts: Debt[], repayments: DebtRepayment[]): NetDebtTotals {
  let owedToHouseholdMinor = 0;
  let householdOwesMinor = 0;
  for (const debt of debts) {
    const status = computeDebtStatus(debt, repayments);
    if (status.isSettled) {
      continue;
    }
    if (debt.direction === 'owed_to_household') {
      owedToHouseholdMinor += status.remainingMinor;
    } else {
      householdOwesMinor += status.remainingMinor;
    }
  }
  return { owedToHouseholdMinor, householdOwesMinor };
}
