import type { Migration } from '../types';

/**
 * Adds the data needed for "notifications de dépassement de plafond" (US-019):
 * - `category_budgets.last_alerted_month` tracks the last month a budget alert was actually sent
 *   for that category, so crossing the threshold only notifies once per month (not on every
 *   subsequent transaction) — `NULL` means "never alerted".
 * - `notification_settings` is a single opt-in row (fixed `id = 'default'`, upserted by the
 *   repository — same one-row pattern as `category_budgets`' one-row-per-category convention).
 *   Quiet hours are a fixed MVP constant (`src/notifications/budgetAlertDecision.ts`), not stored
 *   here — no settings UI for them yet, same "placeholder until a real story needs it" reasoning
 *   as `freePlan.ts`'s entitlement numbers.
 */
export const notificationsMigration: Migration = {
  version: 5,
  name: 'notifications',
  up: `
ALTER TABLE category_budgets ADD COLUMN last_alerted_month TEXT;

CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY NOT NULL,
  budget_alerts_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
};
