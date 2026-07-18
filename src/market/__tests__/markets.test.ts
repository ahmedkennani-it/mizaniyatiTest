import i18n from '../../i18n/i18n';
import {
  ANNOUNCED_MARKETS,
  DEFAULT_COUNTRY_CODE,
  MARKETS,
  SELECTABLE_MARKETS,
  findMarket,
  isMenaGulfMarket,
  marketHasModule,
  marketModules,
  originMarket,
} from '../markets';

describe('market registry (US-003)', () => {
  it('gives every market its own currency', () => {
    for (const market of MARKETS) {
      expect(market.currencyCode).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('covers the currencies the onboarding step announces', () => {
    const currencies = MARKETS.map((market) => market.currencyCode);
    for (const currency of ['MAD', 'DZD', 'TND', 'EGP', 'EUR', 'AED', 'SAR']) {
      expect(currencies).toContain(currency);
    }
  });

  it('names every market through a translation key, never a literal', () => {
    for (const market of MARKETS) {
      expect(market.nameKey).toMatch(/^onboarding\.country/);
    }
  });

  it.each(['fr', 'ar', 'en'])('resolves every market name in %s', async (language) => {
    await i18n.changeLanguage(language);
    for (const market of MARKETS) {
      expect(i18n.t(market.nameKey)).not.toBe(market.nameKey);
    }
    await i18n.changeLanguage('fr');
  });

  it('offers only the launch market today, and announces the rest', () => {
    expect(SELECTABLE_MARKETS.map((market) => market.code)).toEqual(['MA']);
    expect(ANNOUNCED_MARKETS.length).toBeGreaterThan(0);
    expect(DEFAULT_COUNTRY_CODE).toBe('MA');
  });

  it('splits markets into selectable and announced with no overlap', () => {
    expect(SELECTABLE_MARKETS.length + ANNOUNCED_MARKETS.length).toBe(MARKETS.length);
    for (const market of ANNOUNCED_MARKETS) {
      expect(SELECTABLE_MARKETS).not.toContain(market);
    }
  });

  it('confirms Morocco pays in MAD', () => {
    expect(findMarket('MA')?.currencyCode).toBe('MAD');
  });

  it('accepts a lowercase code', () => {
    expect(findMarket('ma')?.code).toBe('MA');
  });
});

/** The business rule: Maroc/DZ/TN → tontine ; France/US → remittances ; Golfe → les deux. */
describe('market modules (US-003)', () => {
  it.each(['MA', 'DZ', 'TN'])('%s runs tontine only', (code) => {
    expect(marketModules(code)).toEqual(['tontine']);
  });

  it('France runs transfers only', () => {
    expect(marketModules('FR')).toEqual(['transfers']);
  });

  it.each(['AE', 'SA'])('the Gulf market %s runs both', (code) => {
    expect(marketModules(code)).toEqual(expect.arrayContaining(['tontine', 'transfers']));
    expect(marketModules(code)).toHaveLength(2);
  });

  it('answers per module', () => {
    expect(marketHasModule('MA', 'tontine')).toBe(true);
    expect(marketHasModule('MA', 'transfers')).toBe(false);
    expect(marketHasModule('AE', 'transfers')).toBe(true);
  });

  /**
   * Showing a tontine tab to a household with no such practice is worse than omitting it, so an
   * unprofiled market gets the diaspora guess rather than the launch market's.
   */
  it('treats an unknown market as diaspora rather than defaulting to tontine', () => {
    expect(marketModules('ZZ')).toEqual(['transfers']);
    expect(marketHasModule('ZZ', 'tontine')).toBe(false);
  });

  it('never leaves a market with no module at all', () => {
    for (const market of MARKETS) {
      expect(market.modules.length).toBeGreaterThan(0);
    }
  });
});

/** US-044: the "Zakat & dons" default category is proposed for MENA/Gulf, not the diaspora. */
describe('isMenaGulfMarket (US-044)', () => {
  it.each(['MA', 'DZ', 'TN', 'EG', 'AE', 'SA'])('%s is MENA/Gulf', (code) => {
    expect(isMenaGulfMarket(code)).toBe(true);
  });

  it('France (diaspora) is not', () => {
    expect(isMenaGulfMarket('FR')).toBe(false);
  });

  it('treats an unprofiled market as diaspora, not MENA/Gulf', () => {
    expect(isMenaGulfMarket('ZZ')).toBe(false);
  });
});

/**
 * US-064: the "pays d'origine" a diaspora household sends money back to is its own configured
 * choice when it has one, and otherwise the launch market (Morocco/MAD) as a placeholder.
 */
describe('originMarket (US-064)', () => {
  it('falls back to Morocco/MAD when nothing is configured', () => {
    expect(originMarket().code).toBe('MA');
    expect(originMarket(null).code).toBe('MA');
    expect(originMarket(undefined).code).toBe('MA');
  });

  it("uses the household's configured origin country", () => {
    expect(originMarket('FR').code).toBe('FR');
    expect(originMarket('AE').currencyCode).toBe('AED');
  });

  it('accepts a lowercase code, like findMarket does', () => {
    expect(originMarket('fr').code).toBe('FR');
  });

  it('falls back to Morocco/MAD for an unknown configured code', () => {
    expect(originMarket('ZZ').code).toBe('MA');
  });
});
