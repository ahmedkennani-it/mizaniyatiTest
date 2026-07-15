import type { Migration } from '../types';

/**
 * Adds `subscriptions` (US-029, `docs/specs/plans-abonnements.md`) — a single fixed-`id='default'`
 * row, same one-row convention as `zakat_config`. No row means the household is on the free plan
 * (see `Subscription`'s doc comment in `db/repositories/types.ts`).
 */
export const subscriptionsMigration: Migration = {
  version: 13,
  name: 'subscriptions',
  up: `
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  trial_ends_at TEXT,
  renews_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
};
