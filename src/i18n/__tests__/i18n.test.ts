import i18n, { DEFAULT_LANGUAGE, isRTLLanguage, SUPPORTED_LANGUAGES } from '../i18n';

/** Flattens a catalog to its dotted leaf paths, so a key missing deep inside a section is caught. */
function collectLeafKeys(bundle: object, prefix = ''): string[] {
  return Object.entries(bundle)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? collectLeafKeys(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort();
}

describe('i18n config', () => {
  it('supports French, Arabic and English, defaulting to French', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['fr', 'ar', 'en']);
    expect(DEFAULT_LANGUAGE).toBe('fr');
  });

  it('loads full translation resources for every language, with matching keys', () => {
    const frKeys = collectLeafKeys(i18n.getResourceBundle('fr', 'translation'));
    expect(collectLeafKeys(i18n.getResourceBundle('ar', 'translation'))).toEqual(frKeys);
    expect(collectLeafKeys(i18n.getResourceBundle('en', 'translation'))).toEqual(frKeys);
  });

  it('flags only Arabic as an RTL language', () => {
    expect(isRTLLanguage('ar')).toBe(true);
    expect(isRTLLanguage('fr')).toBe(false);
  });
});
