import type { DiasporaTransfer } from '../db/repositories';

export interface AnnualTransferSummary {
  year: number;
  totalMinor: number;
  count: number;
}

/**
 * Sums the transfers whose `occurredAt` falls in `year` (US-045's "le total envoyé sur l'année").
 * Pure — the screen supplies `year` from a picker, so switching years never re-queries the
 * database, it just recomputes over the same in-memory list (same pattern as `categoryBudgetStatus`).
 */
export function computeAnnualTransferSummary(
  transfers: DiasporaTransfer[],
  year: number,
): AnnualTransferSummary {
  const forYear = transfers.filter((transfer) => new Date(transfer.occurredAt).getUTCFullYear() === year);
  return {
    year,
    totalMinor: forYear.reduce((sum, transfer) => sum + transfer.amountMinor, 0),
    count: forYear.length,
  };
}

/**
 * The years with at least one transfer, newest first, always including `currentYear` even when
 * empty — so the picker never starts on a year with nothing to select (US-045's "l'année
 * précédente reste consultable").
 */
export function listTransferYears(transfers: DiasporaTransfer[], currentYear: number): number[] {
  const years = new Set(transfers.map((transfer) => new Date(transfer.occurredAt).getUTCFullYear()));
  years.add(currentYear);
  return [...years].sort((a, b) => b - a);
}
