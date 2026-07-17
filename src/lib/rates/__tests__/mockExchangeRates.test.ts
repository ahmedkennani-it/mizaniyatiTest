import { convertAmountMinor, convertAmountMinorWithRate, MOCK_RATES_PER_USD } from '../mockExchangeRates';

describe('convertAmountMinor', () => {
  it('returns the same amount for a same-currency conversion', () => {
    expect(convertAmountMinor(15000, 'EUR', 'EUR')).toBe(15000);
  });

  it('returns null when a currency has no mock rate', () => {
    expect(convertAmountMinor(15000, 'EUR', 'XYZ')).toBeNull();
    expect(convertAmountMinor(15000, 'XYZ', 'EUR')).toBeNull();
  });

  it('converts through the mock USD table', () => {
    // 100.00 EUR -> USD -> MAD, using the table's own rates.
    const expectedMajor = (100 / MOCK_RATES_PER_USD.EUR) * MOCK_RATES_PER_USD.MAD;
    expect(convertAmountMinor(10000, 'EUR', 'MAD')).toBe(Math.round(expectedMajor * 100));
  });

  it('round-trips roughly back to the original amount', () => {
    const toMad = convertAmountMinor(10000, 'EUR', 'MAD');
    expect(toMad).not.toBeNull();
    const backToEur = convertAmountMinor(toMad as number, 'MAD', 'EUR');
    expect(backToEur).not.toBeNull();
    expect(Math.abs((backToEur as number) - 10000)).toBeLessThanOrEqual(1);
  });
});

describe('convertAmountMinorWithRate', () => {
  it('applies a household-entered rate instead of the mock table', () => {
    // 100.00 EUR at a manually-entered "1 EUR = 11 MAD" -> 1 100.00 MAD.
    expect(convertAmountMinorWithRate(10000, 'EUR', 'MAD', 11)).toBe(110000);
  });

  it('respects the target currency\'s own decimal precision', () => {
    // 100.00 EUR at "1 EUR = 0.5 JPY" (0 decimals) -> 50 JPY, not 50.00.
    expect(convertAmountMinorWithRate(10000, 'EUR', 'JPY', 0.5)).toBe(50);
  });
});
