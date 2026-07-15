import type { Migration } from '../types';

/**
 * Adds the seasonal-theme engine from `docs/specs/mode-ramadan.md` (US-026): `seasonal_themes`
 * holds the envelope/date window (generic — `type` lets a future Aïd el-Kebir/rentrée scolaire
 * theme reuse the same table, not just Ramadan), and `categories.seasonal_theme_id` tags the
 * sub-categories generated when a theme is activated (Iftar & Suhoor, Zakat al-Fitr, …) so their
 * spend can be summed against the envelope without mixing in regular category spending —
 * "éviter le double comptage" from the spec's cas limites.
 */
export const seasonalThemesMigration: Migration = {
  version: 11,
  name: 'seasonal_themes',
  up: `
CREATE TABLE IF NOT EXISTS seasonal_themes (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  envelope_minor INTEGER NOT NULL CHECK (envelope_minor >= 0),
  currency_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE categories ADD COLUMN seasonal_theme_id TEXT REFERENCES seasonal_themes(id);
`,
};
