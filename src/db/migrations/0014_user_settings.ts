import type { Migration } from '../types';

/**
 * Adds `user_settings` (US-023, `docs/specs/onboarding-confidentialite.md`'s `userSettings`
 * model) — a single fixed-`id='default'` row, same one-row convention as `subscriptions`/
 * `zakat_config`. `onboarding_step` only ever holds `'language_country'` for now (the sole step
 * this story builds); a row existing at all means that step is done, so `App.tsx`'s onboarding
 * gate treats "no row" as "needs onboarding". US-024 (confidentialité) / US-025 (compte local vs
 * cloud) will `ALTER TABLE` this to add `privacy_accepted_at` / `account_mode` columns and advance
 * `onboarding_step` through their own values — never edit this migration once more steps exist.
 */
export const userSettingsMigration: Migration = {
  version: 14,
  name: 'user_settings',
  up: `
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY NOT NULL,
  language_code TEXT NOT NULL,
  country_code TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  onboarding_step TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
};
