import type { CategoryBreakdownEntry } from '../categoryBreakdown';
import { OTHERS_CATEGORY_ID, TOP_CATEGORY_COUNT, rankCategories } from '../topCategories';

function entry(name: string, totalMinor: number): CategoryBreakdownEntry {
  return { categoryId: `id-${name}`, categoryName: name, totalMinor };
}

/** Breakdown order is already descending — `computeCategoryBreakdown` sorts it. */
const SIX = [
  entry('Courses', 60000),
  entry('Transport', 50000),
  entry('École', 40000),
  entry('Santé', 30000),
  entry('Loisirs', 20000),
  entry('Factures', 10000),
];

describe('rankCategories (US-010)', () => {
  it('leaves a short breakdown untouched', () => {
    const ranked = rankCategories(SIX.slice(0, 3), 'Autres');

    expect(ranked.map((e) => e.categoryName)).toEqual(['Courses', 'Transport', 'École']);
    expect(ranked.every((e) => !e.isOthers)).toBe(true);
  });

  it('keeps exactly four without aggregating', () => {
    const ranked = rankCategories(SIX.slice(0, TOP_CATEGORY_COUNT), 'Autres');

    expect(ranked).toHaveLength(TOP_CATEGORY_COUNT);
    expect(ranked.some((e) => e.isOthers)).toBe(false);
  });

  it('keeps the top four and folds the rest into Autres', () => {
    const ranked = rankCategories(SIX, 'Autres');

    expect(ranked.map((e) => e.categoryName)).toEqual([
      'Courses',
      'Transport',
      'École',
      'Santé',
      'Autres',
    ]);
  });

  /** A ring whose parts don't make the whole is worse than no ring. */
  it('sums the tail rather than dropping it', () => {
    const ranked = rankCategories(SIX, 'Autres');

    const others = ranked.find((e) => e.isOthers);
    expect(others?.totalMinor).toBe(30000); // 20000 + 10000
    expect(ranked.reduce((sum, e) => sum + e.totalMinor, 0)).toBe(
      SIX.reduce((sum, e) => sum + e.totalMinor, 0),
    );
  });

  it('marks the aggregate so a caller can tell it apart', () => {
    const ranked = rankCategories(SIX, 'Autres');

    expect(ranked.at(-1)).toMatchObject({ isOthers: true, categoryId: OTHERS_CATEGORY_ID });
    expect(ranked.slice(0, -1).every((e) => !e.isOthers)).toBe(true);
  });

  it('folds even a single extra category, so the count never exceeds five slices', () => {
    const ranked = rankCategories(SIX.slice(0, 5), 'Autres');

    expect(ranked).toHaveLength(5);
    expect(ranked.at(-1)).toMatchObject({ isOthers: true, totalMinor: 20000 });
  });

  // The label is passed in: this module has no business knowing the active language.
  it('uses the label it is handed', () => {
    expect(rankCategories(SIX, 'أخرى').at(-1)?.categoryName).toBe('أخرى');
  });

  it('handles an empty breakdown', () => {
    expect(rankCategories([], 'Autres')).toEqual([]);
  });

  it('honours a custom top count', () => {
    const ranked = rankCategories(SIX, 'Autres', 2);

    expect(ranked).toHaveLength(3);
    expect(ranked.at(-1)?.totalMinor).toBe(40000 + 30000 + 20000 + 10000);
  });
});
