import { FREE_PLAN } from '../freePlan';

describe('FREE_PLAN', () => {
  it('is marked as the default free plan', () => {
    expect(FREE_PLAN.isDefaultFree).toBe(true);
  });

  it('defines a categories limit', () => {
    const entitlement = FREE_PLAN.entitlements.find((e) => e.key === 'categories.max');
    expect(entitlement?.type).toBe('limit');
    expect(typeof entitlement?.numericValue).toBe('number');
  });

  it('defines a members limit', () => {
    const entitlement = FREE_PLAN.entitlements.find((e) => e.key === 'members.max');
    expect(entitlement?.type).toBe('limit');
    expect(typeof entitlement?.numericValue).toBe('number');
  });
});
