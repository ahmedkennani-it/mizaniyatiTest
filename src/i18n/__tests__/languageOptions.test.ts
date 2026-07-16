import i18n, { SUPPORTED_LANGUAGES } from '../i18n';
import { LANGUAGE_OPTIONS, languageOption, nextLanguage } from '../languageOptions';

describe('LANGUAGE_OPTIONS (US-002)', () => {
  it('covers every supported language, in the same order', () => {
    expect(LANGUAGE_OPTIONS.map((option) => option.code)).toEqual(SUPPORTED_LANGUAGES);
  });

  it('offers the three v1 languages', () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(3);
  });

  it('gives each language a native and a translated name key', () => {
    for (const option of LANGUAGE_OPTIONS) {
      expect(option.nativeNameKey).toMatch(/^language\.native/);
      expect(option.translatedNameKey).toMatch(/^language\./);
      expect(option.nativeNameKey).not.toBe(option.translatedNameKey);
    }
  });
});

describe('language names resolve in every catalog', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('keeps the native names identical across catalogs — that is what native means', async () => {
    for (const language of SUPPORTED_LANGUAGES) {
      await i18n.changeLanguage(language);
      expect(i18n.t('language.nativeArabic')).toBe('العربية');
      expect(i18n.t('language.nativeFrench')).toBe('Français');
      expect(i18n.t('language.nativeEnglish')).toBe('English');
    }
  });

  it('translates the names into the active language', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('language.arabic')).toBe('Arabe');

    await i18n.changeLanguage('en');
    expect(i18n.t('language.arabic')).toBe('Arabic');

    await i18n.changeLanguage('ar');
    expect(i18n.t('language.french')).toBe('الفرنسية');
  });

  // Named in the active language, like any other content: an Arabic reader expects «الدارجة»,
  // not a latin "Darija". So each catalog is checked against its own rendering of the three.
  it.each([
    ['fr', ['Darija', 'Tamazight', 'Türkçe']],
    ['en', ['Darija', 'Tamazight', 'Türkçe']],
    ['ar', ['الدارجة', 'الأمازيغية', 'التركية']],
  ] as const)('names the three coming packs in %s', async (language, names) => {
    await i18n.changeLanguage(language);
    const mention = i18n.t('language.additionalPacks');

    for (const name of names) {
      expect(mention).toContain(name);
    }
  });
});

describe('languageOption', () => {
  it('finds the option for a code', () => {
    expect(languageOption('ar').nativeNameKey).toBe('language.nativeArabic');
  });
});

/**
 * The profile row cycles instead of opening a picker. It has to wrap: the old two-way
 * `fr`/`ar` toggle sent an English user to French and left English unreachable forever after.
 */
describe('nextLanguage', () => {
  it('cycles through every language and returns to the start', () => {
    const visited: string[] = [];
    let current = SUPPORTED_LANGUAGES[0];
    for (let step = 0; step < SUPPORTED_LANGUAGES.length; step += 1) {
      visited.push(current);
      current = nextLanguage(current);
    }

    expect(new Set(visited).size).toBe(SUPPORTED_LANGUAGES.length);
    expect(current).toBe(SUPPORTED_LANGUAGES[0]);
  });

  it('reaches English rather than skipping past it', () => {
    const reachable = SUPPORTED_LANGUAGES.map((code) => nextLanguage(code));
    expect(reachable).toContain('en');
  });
});
