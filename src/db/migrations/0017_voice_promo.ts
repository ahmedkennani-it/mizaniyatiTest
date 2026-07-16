import type { Migration } from '../types';

/**
 * Tracks the voice-entry discovery banner (US-014) on `user_settings`, the app's existing one-row
 * settings table.
 *
 * - `voice_entry_count` — how many transactions the household has dictated. The banner is a
 *   discovery aid, so it retires itself once the feature has been found.
 * - `voice_promo_dismissed` — the household closed it. Kept separate from the count on purpose:
 *   "I know about this and don't want it" is a different statement from "I use it", and folding
 *   the two would make a dismissal look like usage the household never did.
 */
export const voicePromoMigration: Migration = {
  version: 17,
  name: 'voice_promo',
  up: `
ALTER TABLE user_settings ADD COLUMN voice_entry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN voice_promo_dismissed INTEGER NOT NULL DEFAULT 0;
`,
};
