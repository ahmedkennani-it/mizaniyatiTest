/**
 * One recognizable expense word: what to call it on the transaction (`label`) and which category
 * icon it suggests. `icon` matches the shared icon set categories are seeded with
 * (`src/categories/defaultCategories.ts`'s `ICONS_AND_COLORS`) — matching by icon rather than by
 * category name is what lets this work regardless of the household's language or whether they
 * renamed a default category.
 */
export interface DictationKeyword {
  keyword: string;
  label: string;
  categoryIcon: string;
}
