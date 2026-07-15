import type { SqlDatabase } from '../types';
import type { ZakatConfig, ZakatConfigPatch, ZakatNisabBasis } from './types';

const CONFIG_ID = 'default';

interface ZakatConfigRow {
  id: string;
  madhhab: string;
  nisab_basis: string;
  gold_price_per_gram_minor: number | null;
  silver_price_per_gram_minor: number | null;
  price_updated_at: string | null;
}

const DEFAULTS: ZakatConfig = {
  madhhab: '',
  nisabBasis: 'gold',
  goldPricePerGramMinor: null,
  silverPricePerGramMinor: null,
  priceUpdatedAt: null,
};

function fromRow(row: ZakatConfigRow): ZakatConfig {
  return {
    madhhab: row.madhhab,
    nisabBasis: row.nisab_basis as ZakatNisabBasis,
    goldPricePerGramMinor: row.gold_price_per_gram_minor,
    silverPricePerGramMinor: row.silver_price_per_gram_minor,
    priceUpdatedAt: row.price_updated_at,
  };
}

/**
 * Reads the household's Zakat config, defaulting to `{ madhhab: '', nisabBasis: 'gold', ... }`
 * when no row has been saved yet — same lazy-default, no-forced-write approach as
 * `notificationSettingsRepository.getNotificationSettings`.
 */
export async function getZakatConfig(db: SqlDatabase): Promise<ZakatConfig> {
  const row = await db.getFirstAsync<ZakatConfigRow>(
    'SELECT id, madhhab, nisab_basis, gold_price_per_gram_minor, silver_price_per_gram_minor, price_updated_at FROM zakat_config WHERE id = ?;',
    [CONFIG_ID],
  );
  return row ? fromRow(row) : DEFAULTS;
}

/**
 * Upserts the single Zakat config row. Setting `goldPricePerGramMinor`/`silverPricePerGramMinor`
 * bumps `priceUpdatedAt` to now (a manual price entry) — patching only `madhhab`/`nisabBasis`
 * does not, so "fraîcheur du prix" reflects the price itself, not unrelated config edits.
 */
export async function updateZakatConfig(
  db: SqlDatabase,
  patch: ZakatConfigPatch,
): Promise<ZakatConfig> {
  const existing = await getZakatConfig(db);
  const updated: ZakatConfig = { ...existing, ...patch };
  const now = new Date().toISOString();
  const priceUpdatedAt =
    patch.goldPricePerGramMinor !== undefined || patch.silverPricePerGramMinor !== undefined
      ? now
      : existing.priceUpdatedAt;

  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM zakat_config WHERE id = ?;', [
    CONFIG_ID,
  ]);
  if (row) {
    await db.runAsync(
      'UPDATE zakat_config SET madhhab = ?, nisab_basis = ?, gold_price_per_gram_minor = ?, silver_price_per_gram_minor = ?, price_updated_at = ?, updated_at = ? WHERE id = ?;',
      [
        updated.madhhab,
        updated.nisabBasis,
        updated.goldPricePerGramMinor,
        updated.silverPricePerGramMinor,
        priceUpdatedAt,
        now,
        CONFIG_ID,
      ],
    );
  } else {
    await db.runAsync(
      'INSERT INTO zakat_config (id, madhhab, nisab_basis, gold_price_per_gram_minor, silver_price_per_gram_minor, price_updated_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        CONFIG_ID,
        updated.madhhab,
        updated.nisabBasis,
        updated.goldPricePerGramMinor,
        updated.silverPricePerGramMinor,
        priceUpdatedAt,
        now,
        now,
      ],
    );
  }
  return { ...updated, priceUpdatedAt };
}
