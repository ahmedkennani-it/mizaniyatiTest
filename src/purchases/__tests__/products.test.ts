import { PURCHASE_PRODUCTS, fetchAvailableProducts, findPurchaseProduct } from '../products';

describe('purchase products (US-066a/US-066b)', () => {
  it('declares exactly monthly and annual', () => {
    expect(PURCHASE_PRODUCTS.map((product) => product.id)).toEqual(['monthly', 'annual']);
  });

  it('gives the annual product roughly twelve times the monthly duration', () => {
    const monthly = findPurchaseProduct('monthly');
    const annual = findPurchaseProduct('annual');
    expect(annual.durationDays).toBeGreaterThan(monthly.durationDays * 11);
  });

  it('resolves the available products through an async call, like a real store SDK would', async () => {
    await expect(fetchAvailableProducts()).resolves.toEqual(PURCHASE_PRODUCTS);
  });

  it('throws for an unknown product id rather than silently returning nothing', () => {
    expect(() => findPurchaseProduct('lifetime' as never)).toThrow(/Unknown purchase product/);
  });
});
