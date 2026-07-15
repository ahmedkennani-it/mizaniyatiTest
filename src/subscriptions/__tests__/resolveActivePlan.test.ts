import { FREE_PLAN, PRO_PLAN } from '../../entitlements';
import type { Subscription } from '../../db/repositories';
import { resolveActivePlan } from '../resolveActivePlan';

const NOW = new Date('2026-07-09T12:00:00.000Z');

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    planId: 'pro',
    status: 'trial',
    trialEndsAt: null,
    renewsAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveActivePlan', () => {
  it('resolves to the free plan when there is no subscription at all', () => {
    expect(resolveActivePlan(null, NOW)).toBe(FREE_PLAN);
  });

  it('resolves to Pro during an active trial', () => {
    const subscription = makeSubscription({ status: 'trial', trialEndsAt: '2026-07-20T00:00:00.000Z' });
    expect(resolveActivePlan(subscription, NOW)).toBe(PRO_PLAN);
  });

  it('resolves to the free plan once the trial has ended', () => {
    const subscription = makeSubscription({ status: 'trial', trialEndsAt: '2026-07-01T00:00:00.000Z' });
    expect(resolveActivePlan(subscription, NOW)).toBe(FREE_PLAN);
  });

  it('resolves to the free plan for a trial with no end date (defensive)', () => {
    const subscription = makeSubscription({ status: 'trial', trialEndsAt: null });
    expect(resolveActivePlan(subscription, NOW)).toBe(FREE_PLAN);
  });

  it('resolves to Pro for an active (paid) subscription', () => {
    const subscription = makeSubscription({ status: 'active', trialEndsAt: null, renewsAt: '2026-08-01T00:00:00.000Z' });
    expect(resolveActivePlan(subscription, NOW)).toBe(PRO_PLAN);
  });

  it('resolves to the free plan for an expired subscription', () => {
    const subscription = makeSubscription({ status: 'expired' });
    expect(resolveActivePlan(subscription, NOW)).toBe(FREE_PLAN);
  });
});
