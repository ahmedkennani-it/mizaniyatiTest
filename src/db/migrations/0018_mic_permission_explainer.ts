import type { Migration } from '../types';

/**
 * Tracks whether the household has already seen the contextual "why we need the microphone"
 * explainer (US-020a) — shown once, before the very first OS permission prompt, since the OS
 * dialog itself only ever appears once (subsequent taps must go straight to capture, or to the
 * denial fallback if it was refused).
 */
export const micPermissionExplainerMigration: Migration = {
  version: 18,
  name: 'mic_permission_explainer',
  up: `
ALTER TABLE user_settings ADD COLUMN mic_permission_explainer_seen INTEGER NOT NULL DEFAULT 0;
`,
};
