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

  describe('localisation par marché (US-063)', () => {
    it('gives a diaspora market (France) a "Transfert famille" category instead of Zakat, base set unchanged', () => {
      const morocco = getDefaultCategories('fr', 'MA');
      const france = getDefaultCategories('fr', 'FR');

      // Same base 9, no Zakat (France has no tontine module) — only the extra differs.
      expect(france.slice(0, 9).map((c) => c.name)).toEqual(morocco.slice(0, 9).map((c) => c.name));
      expect(france.some((c) => c.name === 'Zakat & dons')).toBe(false);
      expect(france.map((c) => c.name)).toContain('Transfert famille');
    });

    it('highlights the Transferts module\'s category with the plane icon, appended last', () => {
      const france = getDefaultCategories('fr', 'FR');
      const remittance = france.find((c) => c.name === 'Transfert famille');

      expect(remittance?.icon).toBe('plane');
      expect(france[france.length - 1]).toBe(remittance);
    });

    it('gives a Gulf market both Zakat and a "Transfert aux proches" category (both modules)', () => {
      const uae = getDefaultCategories('fr', 'AE');

      expect(uae.map((c) => c.name)).toContain('Zakat & dons');
      expect(uae.map((c) => c.name)).toContain('Transfert aux proches');
      // Not the diaspora wording — a Gulf household already has a tontine, this is an addition.
      expect(uae.map((c) => c.name)).not.toContain('Transfert famille');
    });

    it('relabels the school slot to "Écoles des enfants" for a Gulf market, same icon/color/position', () => {
      const morocco = getDefaultCategories('fr', 'MA');
      const uae = getDefaultCategories('fr', 'AE');

      expect(morocco[1].name).toBe('École');
      expect(uae[1].name).toBe('Écoles des enfants');
      expect(uae[1].icon).toBe(morocco[1].icon);
      expect(uae[1].color).toBe(morocco[1].color);
    });

    it('gives Morocco (tontine-only) neither remittance category, keeping "École" as-is', () => {
      const morocco = getDefaultCategories('fr', 'MA');

      expect(morocco.map((c) => c.name)).not.toContain('Transfert famille');
      expect(morocco.map((c) => c.name)).not.toContain('Transfert aux proches');
      expect(morocco[1].name).toBe('École');
    });

    it('translates the market-specific extras into Arabic and English too', () => {
      expect(getDefaultCategories('en', 'FR').map((c) => c.name)).toContain('Family transfer');
      expect(getDefaultCategories('ar', 'FR').map((c) => c.name)).toContain('تحويل للعائلة');
      expect(getDefaultCategories('en', 'AE').map((c) => c.name)).toContain('Transfer to relatives');
      expect(getDefaultCategories('en', 'AE').map((c) => c.name)).toContain("Children's schools");
    });

    it('never inserts an extra category mid-list — always appended after the (possibly relabeled) base 9', () => {
      const uae = getDefaultCategories('fr', 'AE');
      expect(uae).toHaveLength(11); // 9 base (school relabeled, same count) + Zakat + remittance
      expect(uae.slice(0, 9).map((c) => c.icon)).toEqual(
        getDefaultCategories('fr', 'MA').slice(0, 9).map((c) => c.icon),
      );
    });
  });
});
