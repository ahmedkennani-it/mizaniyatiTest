import { AR_DICTATION_KEYWORDS, EN_DICTATION_KEYWORDS, FR_DICTATION_KEYWORDS } from '../dictationKeywords';
import { deduceCategoryAndLabel } from '../deduceCategoryAndLabel';

describe('deduceCategoryAndLabel', () => {
  it('deduces the label and category icon from the reference sentence (US-021b)', () => {
    expect(deduceCategoryAndLabel('Quarante-deux dirhams de café ce matin', 'fr')).toEqual({
      label: 'Café',
      categoryIcon: 'utensils',
    });
  });

  it('deduces from the English equivalent', () => {
    expect(deduceCategoryAndLabel('Forty-two dirhams for coffee this morning', 'en')).toEqual({
      label: 'Coffee',
      categoryIcon: 'utensils',
    });
  });

  it('deduces from the Arabic equivalent', () => {
    expect(deduceCategoryAndLabel('اثنان وأربعون درهماً للقهوة صباح اليوم', 'ar')).toEqual({
      label: 'قهوة',
      categoryIcon: 'utensils',
    });
  });

  it('ignores the amount, the currency name and time filler words', () => {
    // Nothing here matches a known keyword — the amount/currency/time words must not leak through.
    expect(deduceCategoryAndLabel('Quarante-deux dirhams ce matin', 'fr')).toBeNull();
  });

  it.each([
    ['fr', FR_DICTATION_KEYWORDS],
    ['en', EN_DICTATION_KEYWORDS],
    ['ar', AR_DICTATION_KEYWORDS],
  ] as const)('covers every default category icon at least once (%s)', (_language, keywords) => {
    const icons = ['utensils', 'car', 'health', 'home', 'receipt', 'school', 'film', 'cart'];
    const coveredIcons = new Set(keywords.map((entry) => entry.categoryIcon));
    for (const icon of icons) {
      expect(coveredIcons.has(icon)).toBe(true);
    }
  });

  it('returns null when nothing recognizable was said', () => {
    expect(deduceCategoryAndLabel('Bonjour tout le monde', 'fr')).toBeNull();
    expect(deduceCategoryAndLabel('Hello everyone', 'en')).toBeNull();
    expect(deduceCategoryAndLabel('مرحبا بالجميع', 'ar')).toBeNull();
  });

  it('picks the first matching keyword when several appear', () => {
    expect(deduceCategoryAndLabel('café et restaurant', 'fr')).toEqual({
      label: 'Café',
      categoryIcon: 'utensils',
    });
  });

  it('is case-insensitive', () => {
    expect(deduceCategoryAndLabel('CAFÉ', 'fr')).toEqual({ label: 'Café', categoryIcon: 'utensils' });
  });
});
