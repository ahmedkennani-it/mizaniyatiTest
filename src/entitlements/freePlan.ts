import type { Plan } from './types';

/**
 * Placeholder free-tier entitlements. `docs/PRD.md` (§8, open question 5) leaves the exact free
 * limits ("bornes précises du tier gratuit") to be fixed in the admin platform (US-044) — until
 * that exists, this is the single source of truth the app reads at startup. Update the values
 * here, never in feature code, once the business numbers are confirmed.
 *
 * `categories.max: 3` is fixed by US-031's own acceptance criterion ("plan Gratuit avec 3
 * catégories... 4e catégorie... paywall"), not a placeholder like the others — it's the one
 * number in this file with an explicit spec behind it.
 */
export const FREE_PLAN: Plan = {
  id: 'free',
  name: 'Gratuit',
  isDefaultFree: true,
  entitlements: [
    { key: 'categories.max', type: 'limit', numericValue: 3 },
    { key: 'members.max', type: 'limit', numericValue: 2 },
    { key: 'voice', type: 'feature', booleanValue: false },
    { key: 'tontine', type: 'feature', booleanValue: false },
    { key: 'zakat', type: 'feature', booleanValue: false },
    { key: 'ramadan', type: 'feature', booleanValue: false },
    { key: 'transfers', type: 'feature', booleanValue: false },
  ],
};
