import { getDefaultCategories } from '../defaultCategories';

describe('getDefaultCategories', () => {
  it('returns the Morocco default category set in French', () => {
    const categories = getDefaultCategories('fr');
    expect(categories.map((c) => c.name)).toEqual([
      'Courses',
      'École',
      'Santé',
      'Transport',
      'Factures',
      'Logement',
      'Restaurants',
      'Loisirs',
      'Autres',
    ]);
  });

  it('returns the same set translated in Arabic', () => {
    const fr = getDefaultCategories('fr');
    const ar = getDefaultCategories('ar');

    expect(ar).toHaveLength(fr.length);
    expect(ar.every((c) => /[؀-ۿ]/.test(c.name))).toBe(true);
  });

  it('keeps the same icon and color per position across languages', () => {
    const fr = getDefaultCategories('fr');
    const ar = getDefaultCategories('ar');

    fr.forEach((category, index) => {
      expect(ar[index].icon).toBe(category.icon);
      expect(ar[index].color).toBe(category.color);
    });
  });

  it('gives every category a distinct icon and color', () => {
    const categories = getDefaultCategories('fr');
    expect(new Set(categories.map((c) => c.icon)).size).toBe(categories.length);
    expect(new Set(categories.map((c) => c.color)).size).toBe(categories.length);
  });
});
