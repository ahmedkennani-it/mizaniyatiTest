import type { CategoryBreakdownEntry } from './categoryBreakdown';

/** The ring reads as a proportion, not a legend to decipher; past a handful of slices it stops. */
export const TOP_CATEGORY_COUNT = 4;

/** Marks the aggregate slice, which stands for several categories and so has no id of its own. */
export const OTHERS_CATEGORY_ID = '__others__';

export interface RankedCategoryEntry extends CategoryBreakdownEntry {
  /** True for the aggregate slice — it opens nothing, since it is not one category. */
  isOthers: boolean;
}

/**
 * Keeps the top categories of a breakdown and folds the rest into a single "Autres" slice
 * (US-010). The tail is summed rather than dropped, so the ring's slices always add up to the
 * total shown in its middle — a ring whose parts don't make the whole is worse than no ring.
 *
 * The caller passes the translated label: this module has no business knowing the active language.
 */
export function rankCategories(
  breakdown: CategoryBreakdownEntry[],
  othersLabel: string,
  topCount = TOP_CATEGORY_COUNT,
): RankedCategoryEntry[] {
  const ranked = breakdown.map((entry) => ({ ...entry, isOthers: false }));
  if (ranked.length <= topCount) {
    return ranked;
  }

  const top = ranked.slice(0, topCount);
  const tail = ranked.slice(topCount);
  const othersTotal = tail.reduce((sum, entry) => sum + entry.totalMinor, 0);

  return [
    ...top,
    {
      categoryId: OTHERS_CATEGORY_ID,
      categoryName: othersLabel,
      totalMinor: othersTotal,
      isOthers: true,
    },
  ];
}
