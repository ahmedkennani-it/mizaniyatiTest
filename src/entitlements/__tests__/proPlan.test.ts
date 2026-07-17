import { PRO_PLAN } from '../proPlan';

describe('PRO_PLAN', () => {
  it('is not the default free plan', () => {
    expect(PRO_PLAN.isDefaultFree).toBe(false);
  });

  it('unlocks every Pro feature', () => {
    for (const key of ['tontine', 'zakat', 'ramadan', 'voice', 'transfers']) {
      const entitlement = PRO_PLAN.entitlements.find((e) => e.key === key);
      expect(entitlement?.booleanValue).toBe(true);
    }
  });

  it('has effectively unlimited category/member limits', () => {
    const categoriesMax = PRO_PLAN.entitlements.find((e) => e.key === 'categories.max');
    const membersMax = PRO_PLAN.entitlements.find((e) => e.key === 'members.max');
    expect(categoriesMax?.numericValue).toBeGreaterThan(1000);
    expect(membersMax?.numericValue).toBeGreaterThan(1000);
  });
});
