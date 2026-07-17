import type { DiasporaTransfer } from '../../db/repositories';
import { computeAnnualTransferSummary, listTransferYears } from '../computeAnnualTransferSummary';

function transfer(amountMinor: number, occurredAt: string): DiasporaTransfer {
  return { id: occurredAt, amountMinor, currencyCode: 'EUR', occurredAt, createdAt: occurredAt };
}

describe('computeAnnualTransferSummary', () => {
  it('sums only the transfers that occurred in the given year', () => {
    const transfers = [
      transfer(10000, '2026-01-15T00:00:00.000Z'),
      transfer(20000, '2026-06-01T00:00:00.000Z'),
      transfer(50000, '2025-12-31T00:00:00.000Z'),
    ];

    expect(computeAnnualTransferSummary(transfers, 2026)).toEqual({
      year: 2026,
      totalMinor: 30000,
      count: 2,
    });
  });

  it('resets to zero for a year with no transfers, without touching other years', () => {
    const transfers = [transfer(10000, '2025-03-01T00:00:00.000Z')];

    expect(computeAnnualTransferSummary(transfers, 2026)).toEqual({
      year: 2026,
      totalMinor: 0,
      count: 0,
    });
    expect(computeAnnualTransferSummary(transfers, 2025).totalMinor).toBe(10000);
  });
});

describe('listTransferYears', () => {
  it('always includes the current year, even with no transfers yet', () => {
    expect(listTransferYears([], 2026)).toEqual([2026]);
  });

  it('lists years with data plus the current year, newest first, without duplicates', () => {
    const transfers = [
      transfer(10000, '2024-05-01T00:00:00.000Z'),
      transfer(20000, '2025-05-01T00:00:00.000Z'),
      transfer(30000, '2025-11-01T00:00:00.000Z'),
    ];

    expect(listTransferYears(transfers, 2026)).toEqual([2026, 2025, 2024]);
  });
});
