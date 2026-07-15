import type { Plan } from './types';

/**
 * Placeholder Pro-tier entitlements — same "admin will fix the real numbers" caveat as
 * `freePlan.ts`. `categories.max`/`members.max` use `Number.MAX_SAFE_INTEGER` rather than a
 * dedicated "unlimited" concept in the engine, since `EntitlementsEngine.limit()` is a plain
 * number comparison (`currentCount >= engine.limit(key)`) everywhere it's consumed — this reaches
 * the same "never blocks" behavior without a special case in every caller.
 */
export const PRO_PLAN: Plan = {
  id: 'pro',
  name: 'Pro',
  isDefaultFree: false,
  entitlements: [
    { key: 'categories.max', type: 'limit', numericValue: Number.MAX_SAFE_INTEGER },
    { key: 'members.max', type: 'limit', numericValue: Number.MAX_SAFE_INTEGER },
    { key: 'voice', type: 'feature', booleanValue: true },
    { key: 'tontine', type: 'feature', booleanValue: true },
    { key: 'zakat', type: 'feature', booleanValue: true },
    { key: 'ramadan', type: 'feature', booleanValue: true },
  ],
};
