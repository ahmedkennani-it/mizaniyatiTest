import { createEntitlementsEngine } from '../engine';
import type { Plan } from '../types';

const testPlan: Plan = {
  id: 'test',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [
    { key: 'categories.max', type: 'limit', numericValue: 10 },
    { key: 'voice', type: 'feature', booleanValue: true },
    { key: 'tontine', type: 'feature', booleanValue: false },
  ],
};

describe('createEntitlementsEngine', () => {
  it('can() returns true for an enabled feature', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.can('voice')).toBe(true);
  });

  it('can() returns false for a disabled feature', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.can('tontine')).toBe(false);
  });

  it('can() returns false for an unknown feature key', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.can('unknown-feature')).toBe(false);
  });

  it('limit() returns the numeric value for a known limit', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.limit('categories.max')).toBe(10);
  });

  it('limit() returns 0 for an unknown limit key', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.limit('unknown-limit')).toBe(0);
  });

  it('exposes the plan it was created from', () => {
    const engine = createEntitlementsEngine(testPlan);
    expect(engine.plan).toBe(testPlan);
  });

  describe('limite atteinte vs non atteinte', () => {
    it('reports the limit as not reached when usage is below it', () => {
      const engine = createEntitlementsEngine(testPlan);
      const currentCategoryCount = 9;
      expect(currentCategoryCount >= engine.limit('categories.max')).toBe(false);
    });

    it('reports the limit as reached when usage equals it', () => {
      const engine = createEntitlementsEngine(testPlan);
      const currentCategoryCount = 10;
      expect(currentCategoryCount >= engine.limit('categories.max')).toBe(true);
    });

    it('reports the limit as reached when usage exceeds it', () => {
      const engine = createEntitlementsEngine(testPlan);
      const currentCategoryCount = 11;
      expect(currentCategoryCount >= engine.limit('categories.max')).toBe(true);
    });
  });

  it('changes behavior with no code change when swapping plans (e.g. Pro unlocks tontine)', () => {
    const proPlan: Plan = {
      ...testPlan,
      id: 'pro',
      name: 'Pro',
      entitlements: [
        ...testPlan.entitlements.filter((entitlement) => entitlement.key !== 'tontine'),
        { key: 'tontine', type: 'feature', booleanValue: true },
      ],
    };
    const freeEngine = createEntitlementsEngine(testPlan);
    const proEngine = createEntitlementsEngine(proPlan);

    expect(freeEngine.can('tontine')).toBe(false);
    expect(proEngine.can('tontine')).toBe(true);
  });
});
