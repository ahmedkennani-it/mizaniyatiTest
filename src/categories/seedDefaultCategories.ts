import { createCategory, listCategories } from '../db/repositories';
import type { Category } from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import type { SupportedLanguage } from '../i18n/i18n';
import { getDefaultCategories } from './defaultCategories';

/**
 * "Étant donné un changement de pays, alors les modules sont reproposés sans supprimer les
 * données déjà saisies" (US-063). Unlike `seedDefaultCategories`'s coarse "any default exists ->
 * no-op" guard, this compares *by icon* — the stable identifier already used elsewhere (US-035's
 * voice deduction, US-043's Zakat lookup) — against the *new* country's default set, and only
 * creates whatever's actually missing. Never touches, renames, or deletes an existing category, so
 * a household that already customized its categories never has that work silently undone by
 * switching markets.
 */
export async function reconcileMarketCategories(
  db: SqlDatabase,
  language: SupportedLanguage,
  countryCode: string,
): Promise<Category[]> {
  const existing = await listCategories(db);
  const existingDefaultIcons = new Set(
    existing.filter((category) => category.isDefault).map((category) => category.icon),
  );
  const missing = getDefaultCategories(language, countryCode).filter(
    (definition) => !existingDefaultIcons.has(definition.icon),
  );
  if (missing.length === 0) {
    return [];
  }

  const nextOrderIndex = existing.reduce((max, category) => Math.max(max, category.orderIndex), -1) + 1;
  const created: Category[] = [];
  for (const [offset, definition] of missing.entries()) {
    created.push(
      await createCategory(db, {
        name: definition.name,
        icon: definition.icon,
        color: definition.color,
        isDefault: true,
        orderIndex: nextOrderIndex + offset,
      }),
    );
  }
  return created;
}

/**
 * Loads the Morocco default category set at profile initialization (US-009). Idempotent: if any
 * default category already exists (a prior run already seeded, or a sync pulled some down),
 * this is a no-op rather than inserting duplicates.
 */
export async function seedDefaultCategories(
  db: SqlDatabase,
  language: SupportedLanguage,
  countryCode?: string,
): Promise<Category[]> {
  const existing = await listCategories(db);
  if (existing.some((category) => category.isDefault)) {
    return existing.filter((category) => category.isDefault);
  }

  const seeded: Category[] = [];
  const defaults = getDefaultCategories(language, countryCode);
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
