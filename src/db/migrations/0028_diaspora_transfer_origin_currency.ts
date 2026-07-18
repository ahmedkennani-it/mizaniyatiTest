import type { Migration } from '../types';

/**
 * Snapshots the currency `origin_amount_minor` was expressed in at recording time (US-064) —
 * `origin_amount_minor` itself has been "snapshot, don't recompute" since `0024`, but until now
 * the currency it was converted *into* was implicitly always `DEFAULT_ORIGIN_CURRENCY_CODE`
 * (a hardcoded constant). Now that a household can configure its own "pays d'origine"
 * (`user_settings.origin_country_code`, `0027`), that currency can change over time, so it must
 * be stored per-row too — otherwise a household that switches origin country would see every past
 * transfer's contre-valeur silently relabeled in the new currency. `NULL` on existing rows is
 * correct: they were recorded before this column existed, and the screen falls back to treating
 * them as `DEFAULT_ORIGIN_CURRENCY_CODE`, which is what they actually were.
 */
export const diasporaTransferOriginCurrencyMigration: Migration = {
  version: 28,
  name: 'diaspora_transfer_origin_currency',
  up: `ALTER TABLE diaspora_transfers ADD COLUMN origin_currency_code TEXT;`,
};
