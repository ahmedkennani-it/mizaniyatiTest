// Pins the device locale the i18n bootstrap (`src/i18n/i18n.ts`) detects at import time. Without
// this, `Localization.getLocales()` returns whatever locale the machine running jest happens to
// use, so the app would render in English on an en-US laptop and in French on a fr-FR one — every
// screen assertion would depend on the developer's system settings. French is the app's
// DEFAULT_LANGUAGE; tests covering another language switch to it explicitly.
jest.mock('expo-localization', () => ({
  getLocales: () => [
    { languageCode: 'fr', languageTag: 'fr-MA', regionCode: 'MA', currencyCode: 'MAD' },
  ],
}));
