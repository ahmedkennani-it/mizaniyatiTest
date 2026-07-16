import { marketHasTontine, resolveTabs } from '../marketTabs';

describe('marketHasTontine (US-013)', () => {
  it.each(['MA', 'DZ', 'TN', 'SN'])('is true for %s, where the practice is everyday', (code) => {
    expect(marketHasTontine(code)).toBe(true);
  });

  it.each(['FR', 'ES', 'BE', 'CA'])('is false for the diaspora market %s', (code) => {
    expect(marketHasTontine(code)).toBe(false);
  });

  it('accepts a lowercase code', () => {
    expect(marketHasTontine('ma')).toBe(true);
  });

  it('treats an unknown market as having no tontine', () => {
    expect(marketHasTontine('ZZ')).toBe(false);
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

  it('never shows Tontine and Transferts at once', () => {
    for (const country of ['MA', 'FR', 'DZ', 'ES']) {
      const tabs = resolveTabs(country, false);
      expect(tabs.includes('tontine') && tabs.includes('transfers')).toBe(false);
    }
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
