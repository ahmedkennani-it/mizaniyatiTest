// Must come first: it fills in the `Intl` APIs Hermes lacks, and `i18next.init` below resolves
// plural rules through `Intl.PluralRules` as soon as it runs.
import './intlPolyfills';

import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { ar } from './locales/ar';
import { en } from './locales/en';
import { fr } from './locales/fr';

export type SupportedLanguage = 'fr' | 'ar' | 'en';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'ar', 'en'];
export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

export const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
} as const;

export function isRTLLanguage(language: string): boolean {
  return RTL_LANGUAGES.includes(language as SupportedLanguage);
}

function detectDeviceLanguage(): SupportedLanguage {
  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  return SUPPORTED_LANGUAGES.includes(deviceLanguageCode as SupportedLanguage)
    ? (deviceLanguageCode as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

// eslint-disable-next-line import/no-named-as-default-member -- idiomatic i18next chaining
void i18next.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18next;
