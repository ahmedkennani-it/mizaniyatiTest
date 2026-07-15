import type { Migration } from '../types';

/**
 * Adds the `isDefault`/`orderIndex` fields from the `category` model in
 * `docs/specs/categories-plafonds.md` — needed to seed and display the Morocco default category
 * set (US-009) distinctly from user-created ones, with a curated display order.
 */
export const categoryDefaultsMigration: Migration = {
  version: 2,
  name: 'category_defaults',
  up: `
ALTER TABLE categories ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
`,
};
