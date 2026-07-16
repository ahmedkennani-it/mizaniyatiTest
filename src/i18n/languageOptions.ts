import { SUPPORTED_LANGUAGES } from './i18n';
import type { SupportedLanguage } from './i18n';

export interface LanguageOption {
  code: SupportedLanguage;
  /** i18n key for the name in the language's own script ("العربية"). */
  nativeNameKey: string;
  /** i18n key for the name in the *active* language ("Arabe" in a French UI). */
  translatedNameKey: string;
}

const NAME_KEYS: Record<SupportedLanguage, Omit<LanguageOption, 'code'>> = {
  fr: { nativeNameKey: 'language.nativeFrench', translatedNameKey: 'language.french' },
  ar: { nativeNameKey: 'language.nativeArabic', translatedNameKey: 'language.arabic' },
  en: { nativeNameKey: 'language.nativeEnglish', translatedNameKey: 'language.english' },
};

/**
 * The v1 languages, in the order the pickers show them (US-002). Derived from
 * `SUPPORTED_LANGUAGES` rather than listed again, so adding a language is one edit: both the
 * onboarding step and the profile picker used to hardcode `fr`/`ar` and silently dropped English
 * once its catalog landed.
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  ...NAME_KEYS[code],
}));

/** The option for a language code — never `undefined` for a supported one. */
export function languageOption(code: SupportedLanguage): LanguageOption {
  return LANGUAGE_OPTIONS.find((option) => option.code === code) ?? LANGUAGE_OPTIONS[0];
}

/**
 * The next language in the list, wrapping around — for the profile row that cycles rather than
 * opening a picker. It **wraps**: a two-way `fr`/`ar` toggle left English unreachable forever once
 * a user on an English phone switched away from it even once.
 */
export function nextLanguage(current: SupportedLanguage): SupportedLanguage {
  const index = LANGUAGE_OPTIONS.findIndex((option) => option.code === current);
  return LANGUAGE_OPTIONS[(index + 1) % LANGUAGE_OPTIONS.length].code;
}
