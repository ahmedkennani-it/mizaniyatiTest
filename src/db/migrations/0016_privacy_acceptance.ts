import type { Migration } from '../types';

/**
 * Adds `privacy_accepted_at` to `user_settings` (US-004) — the timestamp of the moment the
 * household accepted the privacy commitments, which is the evidence that the promise was shown
 * and acknowledged rather than assumed.
 *
 * Nullable on purpose: a household that completed the language & country step before this column
 * existed has no acceptance to backfill, and inventing one would be fabricating the very consent
 * the column records. `App.tsx` reads `null` as "still owes the privacy step".
 *
 * This is the `ALTER TABLE` that `0014_user_settings`'s note anticipated. `onboarding_step` gains
 * its `'privacy'` value here too — it is a plain TEXT column, so no schema change is needed for it.
 */
export const privacyAcceptanceMigration: Migration = {
  version: 16,
  name: 'privacy_acceptance',
  up: `
ALTER TABLE user_settings ADD COLUMN privacy_accepted_at TEXT;
`,
};
