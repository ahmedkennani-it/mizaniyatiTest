import { annualDiscountPercent, priceFor } from '../pricing';

describe('priceFor (US-066b)', () => {
  it('prices the monthly product at 39 MAD in the launch market', () => {
    expect(priceFor('monthly', 'MAD')).toEqual({ id: 'monthly', amountMinor: 3900, currencyCode: 'MAD' });
  });

  it('prices the annual product at 279 MAD in the launch market', () => {
    expect(priceFor('annual', 'MAD')).toEqual({ id: 'annual', amountMinor: 27900, currencyCode: 'MAD' });
  });

  it('converts into another market’s currency through the mock rate table', () => {
    const price = priceFor('monthly', 'EUR');

    expect(price.currencyCode).toBe('EUR');
    expect(price.amountMinor).toBeGreaterThan(0);
    expect(price.amountMinor).not.toBe(3900);
  });

  it('falls back to the MAD price for a currency the mock rate table does not cover', () => {
    expect(priceFor('monthly', 'JPY')).toEqual({ id: 'monthly', amountMinor: 3900, currencyCode: 'MAD' });
  });
});

describe('annualDiscountPercent (US-066b)', () => {
  it('matches the -40% badge required by the spec', () => {
    expect(annualDiscountPercent()).toBe(40);
  });
});
