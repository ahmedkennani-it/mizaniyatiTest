import { getDefaultCategories } from '../defaultCategories';

describe('getDefaultCategories', () => {
  it('returns the Morocco default category set in French, including Zakat & dons (US-044)', () => {
    const categories = getDefaultCategories('fr', 'MA');
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
      'Zakat & dons',
    ]);
  });

  it('defaults to the launch market (Morocco) when no country is given', () => {
    expect(getDefaultCategories('fr').map((c) => c.name)).toEqual(
      getDefaultCategories('fr', 'MA').map((c) => c.name),
    );
  });

  it('does not include Zakat & dons for a non-MENA/Gulf market, but the rest of the set is unchanged', () => {
    const morocco = getDefaultCategories('fr', 'MA');
    const france = getDefaultCategories('fr', 'FR');

    expect(france.map((c) => c.name)).toEqual(morocco.slice(0, -1).map((c) => c.name));
    expect(france.some((c) => c.name === 'Zakat & dons')).toBe(false);
  });

  it('includes Zakat & dons for the other MENA/Gulf markets too (Gulf, not just Morocco)', () => {
    expect(getDefaultCategories('fr', 'AE').some((c) => c.name === 'Zakat & dons')).toBe(true);
    expect(getDefaultCategories('fr', 'SA').some((c) => c.name === 'Zakat & dons')).toBe(true);
    expect(getDefaultCategories('fr', 'DZ').some((c) => c.name === 'Zakat & dons')).toBe(true);
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
