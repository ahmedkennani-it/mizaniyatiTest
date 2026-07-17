import { DEFAULT_ORIGIN_CURRENCY_CODE } from '../lib/rates';

/** A local money practice the app can turn on for a market. */
export type MarketModule = 'tontine' | 'transfers';

export interface Market {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** ISO 4217 — the market's own currency, confirmed under the country at onboarding. */
  currencyCode: string;
  /** i18n key for the display name — see `onboarding.country*` in `src/i18n/locales/`. */
  nameKey: string;
  /**
   * Which local modules this market runs (US-003's rule): the Maghreb runs tontines, the diaspora
   * runs remittances, and the Gulf runs **both** — expat households there send money home *and*
   * sit in a jam'iya.
   */
  modules: MarketModule[];
  /**
   * Whether the market can be picked today. MVP launch is Morocco-only (`docs/PRD.md` §4); the
   * others are listed so the onboarding step can name where the app is going without pretending
   * they work yet.
   */
  selectable: boolean;
}

export const MARKETS: Market[] = [
  { code: 'MA', currencyCode: 'MAD', nameKey: 'onboarding.countryMorocco', modules: ['tontine'], selectable: true },
  { code: 'DZ', currencyCode: 'DZD', nameKey: 'onboarding.countryAlgeria', modules: ['tontine'], selectable: false },
  { code: 'TN', currencyCode: 'TND', nameKey: 'onboarding.countryTunisia', modules: ['tontine'], selectable: false },
  { code: 'EG', currencyCode: 'EGP', nameKey: 'onboarding.countryEgypt', modules: ['tontine'], selectable: false },
  { code: 'FR', currencyCode: 'EUR', nameKey: 'onboarding.countryFrance', modules: ['transfers'], selectable: false },
  {
    code: 'AE',
    currencyCode: 'AED',
    nameKey: 'onboarding.countryUae',
    modules: ['tontine', 'transfers'],
    selectable: false,
  },
  {
    code: 'SA',
    currencyCode: 'SAR',
    nameKey: 'onboarding.countrySaudi',
    modules: ['tontine', 'transfers'],
    selectable: false,
  },
];

/** The markets a household can actually choose at onboarding. */
export const SELECTABLE_MARKETS: Market[] = MARKETS.filter((market) => market.selectable);

/** Fallback market before onboarding has stored a choice — the launch market. */
export const DEFAULT_COUNTRY_CODE = SELECTABLE_MARKETS[0].code;

/** The markets named on the onboarding step as coming, never offered as a choice. */
export const ANNOUNCED_MARKETS: Market[] = MARKETS.filter((market) => !market.selectable);

export function findMarket(countryCode: string): Market | undefined {
  return MARKETS.find((market) => market.code === countryCode.toUpperCase());
}

/**
 * The modules a market runs. An unknown market gets `transfers` only: the conservative guess for
 * a country we haven't profiled is the diaspora one — showing a tontine tab to a household with
 * no such practice is worse than omitting it.
 */
export function marketModules(countryCode: string): MarketModule[] {
  return findMarket(countryCode)?.modules ?? ['transfers'];
}

export function marketHasModule(countryCode: string, module: MarketModule): boolean {
  return marketModules(countryCode).includes(module);
}

/**
 * MENA/Gulf markets get culturally-relevant defaults (the "Zakat & dons" category, US-044) that a
 * diaspora market doesn't get seeded automatically — still creatable there, just not proposed.
 * Reuses the `tontine` module signal rather than a second, separately-maintained country list:
 * in this registry the two already describe the same MENA+Gulf/diaspora split (`marketModules`'s
 * own comment — "the Maghreb runs tontines... the Gulf runs both").
 */
export function isMenaGulfMarket(countryCode: string): boolean {
  return marketHasModule(countryCode, 'tontine');
}

/**
 * The market money is sent "back home" to, from the Transferts screen's perspective (US-045/047)
 * — always the one whose currency matches `DEFAULT_ORIGIN_CURRENCY_CODE`, a placeholder until
 * US-064 (phase 15) lets a household configure its own origin country. Falls back to `MARKETS[0]`
 * (Morocco) if that constant is ever pointed at a currency not in this registry.
 */
export function originMarket(): Market {
  return MARKETS.find((market) => market.currencyCode === DEFAULT_ORIGIN_CURRENCY_CODE) ?? MARKETS[0];
}
