import type { Migration } from '../types';

/**
 * Records which of the two products (US-066a/US-066b, `monthly`/`annual`) a purchase was for —
 * needed once a real purchase (not just the trial) can set `status: 'active'`, so the subscription
 * management screen (US-069) can say "Annual plan" rather than just "Pro". `NULL` on existing rows
 * (trial-only so far) and stays `NULL` for any future trial row.
 */
export const subscriptionProductMigration: Migration = {
  version: 29,
  name: 'subscription_product',
  up: `ALTER TABLE subscriptions ADD COLUMN product_id TEXT;`,
};
