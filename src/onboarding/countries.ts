/**
 * Country options offered on the "langue & pays" onboarding step (US-023). MVP launch is
 * Morocco-only (`docs/PRD.md` §4 — multi-market/multi-devise is explicitly post-MVP), so this
 * is a list of one today; it's still a list (not a single hardcoded constant) so a future market
 * only needs a new entry here, not a rewrite of the picker UI in
 * `OnboardingLanguageCountryScreen`.
 */
export interface CountryOption {
  code: string;
  currencyCode: string;
  /** i18n key for the display name — see `onboarding.countryMorocco` in `src/i18n/locales/`. */
  nameKey: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [{ code: 'MA', currencyCode: 'MAD', nameKey: 'onboarding.countryMorocco' }];

export const DEFAULT_COUNTRY_CODE = SUPPORTED_COUNTRIES[0].code;
