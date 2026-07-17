import type { Migration } from '../types';

/**
 * Tracks which approximate Hijri year the household last dismissed the "activate Ramadan mode?"
 * dashboard suggestion (US-041) — a year number, not a boolean, since the suggestion is expected
 * to resurface every year rather than being silenced forever after one dismissal.
 */
export const ramadanSuggestionMigration: Migration = {
  version: 20,
  name: 'ramadan_suggestion',
  up: `
ALTER TABLE user_settings ADD COLUMN ramadan_suggestion_dismissed_hijri_year INTEGER;
`,
};
