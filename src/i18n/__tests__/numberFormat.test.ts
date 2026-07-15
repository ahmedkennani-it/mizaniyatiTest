import { forceLTR, toLocalizedDigits } from '../numberFormat';

describe('toLocalizedDigits', () => {
  it('formats with Western digits for French', () => {
    expect(toLocalizedDigits(1234.5, 'fr')).toBe('1.234,5');
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
