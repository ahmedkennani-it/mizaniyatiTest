import type { Migration } from '../types';

/**
 * Recording fields for `diaspora_transfers` (US-047): `method` (how the money was actually sent),
 * and the converted amount snapshotted at recording time. `origin_amount_minor` is never
 * recomputed from the live mock rate table later — a rate change after the fact must not silently
 * rewrite a past transfer's contre-valeur, same "snapshot, don't recompute" rule already applied to
 * `zakat_assessments`/`tontine_rounds`. `rate_is_manual` distinguishes a household-entered rate
 * from the mock table, per the business rule that a manual rate can always override the indicative
 * one. `method` gets a `DEFAULT` so the `0022`/`0023`-era rows already on a device backfill cleanly.
 */
export const diasporaTransferRecordingMigration: Migration = {
  version: 24,
  name: 'diaspora_transfer_recording',
  up: `
ALTER TABLE diaspora_transfers ADD COLUMN method TEXT NOT NULL DEFAULT 'other' CHECK (method IN ('wise', 'cash', 'other'));
ALTER TABLE diaspora_transfers ADD COLUMN origin_amount_minor INTEGER CHECK (origin_amount_minor IS NULL OR origin_amount_minor > 0);
ALTER TABLE diaspora_transfers ADD COLUMN rate_is_manual INTEGER NOT NULL DEFAULT 0 CHECK (rate_is_manual IN (0, 1));
`,
};
