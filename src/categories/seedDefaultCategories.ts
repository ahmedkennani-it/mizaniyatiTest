import { createCategory, listCategories } from '../db/repositories';
import type { Category } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import type { SupportedLanguage } from '../i18n/i18n';
import { getDefaultCategories } from './defaultCategories';

/**
 * Loads the Morocco default category set at profile initialization (US-009). Idempotent: if any
 * default category already exists (a prior run already seeded, or a sync pulled some down),
 * this is a no-op rather than inserting duplicates.
 */
export async function seedDefaultCategories(
  db: SqlDatabase,
  language: SupportedLanguage,
): Promise<Category[]> {
  const existing = await listCategories(db);
  if (existing.some((category) => category.isDefault)) {
    return existing.filter((category) => category.isDefault);
  }

  const seeded: Category[] = [];
  const defaults = getDefaultCategories(language);
  for (const [orderIndex, definition] of defaults.entries()) {
    seeded.push(
      await createCategory(db, {
        name: definition.name,
        icon: definition.icon,
        color: definition.color,
        isDefault: true,
        orderIndex,
      }),
    );
  }
  return seeded;
}
