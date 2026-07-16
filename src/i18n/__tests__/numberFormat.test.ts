import { forceLTR, toLocalizedDigits } from '../numberFormat';

describe('toLocalizedDigits', () => {
  // Grouped with a narrow no-break space (U+202F) per US-062, not the period CLDR's fr-MA gives.
  // Spelled as an escape because the separator is invisible in a diff and easily typed as a plain
  // space, which would make this assert the opposite of what it means to.
  it('formats with Western digits for French', () => {
    expect(toLocalizedDigits(1234.5, 'fr')).toBe('1\u202F234,5');
  });

  it('formats with Arabic-indic digits for Arabic', () => {
    expect(toLocalizedDigits(1234.5, 'ar')).toBe('١٬٢٣٤٫٥');
  });
});

describe('forceLTR', () => {
  it('wraps text with left-to-right marks', () => {
    const wrapped = forceLTR('123');
    expect(wrapped).toBe('‎123‎');
    expect(wrapped).not.toBe('123');
  });
});
