import i18n, { DEFAULT_LANGUAGE, isRTLLanguage, SUPPORTED_LANGUAGES } from '../i18n';

describe('i18n config', () => {
  it('supports French and Arabic, defaulting to French', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['fr', 'ar']);
    expect(DEFAULT_LANGUAGE).toBe('fr');
  });

  it('loads full translation resources for both languages, with matching keys', () => {
    const frKeys = Object.keys(i18n.getResourceBundle('fr', 'translation'));
    const arKeys = Object.keys(i18n.getResourceBundle('ar', 'translation'));
    expect(arKeys.sort()).toEqual(frKeys.sort());
  });

  it('flags only Arabic as an RTL language', () => {
    expect(isRTLLanguage('ar')).toBe(true);
    expect(isRTLLanguage('fr')).toBe(false);
  });
});
