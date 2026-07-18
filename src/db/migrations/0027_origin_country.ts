import type { Migration } from '../types';

/**
 * `user_settings.origin_country_code` (US-064): the "pays d'origine" a diaspora household sends
 * money back to, configurable independently of the household's own country of residence. Nullable
 * — `NULL` means "not configured yet", in which case the Transferts screen keeps falling back to
 * `DEFAULT_ORIGIN_CURRENCY_CODE` exactly as it did before this setting existed.
 */
export const originCountryMigration: Migration = {
  version: 27,
  name: 'origin_country',
  up: `
ALTER TABLE user_settings ADD COLUMN origin_country_code TEXT;
`,
};
