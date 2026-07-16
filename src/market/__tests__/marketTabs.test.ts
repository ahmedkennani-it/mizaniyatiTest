import { marketHasTontine, resolveTabs } from '../marketTabs';

describe('marketHasTontine (US-013)', () => {
  it.each(['MA', 'DZ', 'TN', 'EG'])('is true for %s, where the practice is everyday', (code) => {
    expect(marketHasTontine(code)).toBe(true);
  });

  // The Gulf runs both, so it still has a tontine tab (US-003's rule).
  it.each(['AE', 'SA'])('is true for the Gulf market %s, which runs both modules', (code) => {
    expect(marketHasTontine(code)).toBe(true);
  });

  it('is false for the diaspora market FR', () => {
    expect(marketHasTontine('FR')).toBe(false);
  });

  it('accepts a lowercase code', () => {
    expect(marketHasTontine('ma')).toBe(true);
  });

  // Unprofiled markets fall back to the diaspora guess — see `marketModules`.
  it.each(['ES', 'BE', 'CA', 'ZZ'])('is false for the unprofiled market %s', (code) => {
    expect(marketHasTontine(code)).toBe(false);
  });
});

describe('resolveTabs (US-013)', () => {
  it('shows the four tabs in a tontine market', () => {
    expect(resolveTabs('MA', false)).toEqual(['home', 'categories', 'tontine', 'profile']);
  });

  it('swaps Tontine for Transferts in a market without one', () => {
    expect(resolveTabs('FR', false)).toEqual(['home', 'categories', 'transfers', 'profile']);
  });

  // The swap is one slot, not a reshuffle: everything else keeps its place.
  it('keeps the tab count and order across markets', () => {
    const morocco = resolveTabs('MA', false);
    const france = resolveTabs('FR', false);

    expect(france).toHaveLength(morocco.length);
    expect(france.indexOf('transfers')).toBe(morocco.indexOf('tontine'));
  });

  // The bar has one slot for a local module, so even a market running both never shows two.
  it('never shows Tontine and Transferts at once', () => {
    for (const country of ['MA', 'FR', 'DZ', 'ES', 'AE', 'SA']) {
      const tabs = resolveTabs(country, false);
      expect(tabs.includes('tontine') && tabs.includes('transfers')).toBe(false);
    }
  });

  // A Gulf household runs both; the bar shows the weekly ritual, not the monthly transfer.
  it('gives the tontine slot to a market running both modules', () => {
    expect(resolveTabs('AE', false)).toEqual(['home', 'categories', 'tontine', 'profile']);
  });

  describe('senior mode', () => {
    it('keeps only Accueil and Profil', () => {
      expect(resolveTabs('MA', true)).toEqual(['home', 'profile']);
    });

    it('simplifies the same way regardless of market', () => {
      expect(resolveTabs('FR', true)).toEqual(resolveTabs('MA', true));
    });
  });
});
