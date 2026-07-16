import { formatMoney } from '../money';
import { toLocalizedDigits } from '../../i18n/numberFormat';

const ARABIC_THOUSANDS_SEPARATOR = '\u066C';
const ARABIC_DECIMAL_SEPARATOR = '\u066B';

/** Strips the LTR isolation marks `formatMoney` adds, to assert on the format itself. */
function unwrap(formatted: string): string {
  return formatted.replace(/\u200E/g, '');
}

/**
 * US-062, market-by-market number conventions. These assert exact separators rather than a loose
 * regex — `/1.234,50/` silently passes on `1 234,50` too, since `.` matches any character, which
 * is how the French grouping went unchecked for so long.
 */
describe('French (fr) number formats', () => {
  it('groups thousands with a period and uses a comma decimal (Moroccan French)', () => {
    expect(unwrap(formatMoney(123450, 'MAD', 'fr'))).toContain('1.234,50');
  });

  it('groups every three digits on larger amounts', () => {
    expect(unwrap(toLocalizedDigits(1234567, 'fr'))).toBe('1.234.567');
  });

  // Metropolitan `fr-FR` groups with a space; the launch market's `fr-MA` must not.
  it('does not group with a space of any kind', () => {
    expect(unwrap(formatMoney(123450, 'MAD', 'fr'))).not.toMatch(/1[\u0020\u00A0\u202F]234/);
  });
});

describe('English (en) number formats', () => {
  it('uses comma thousands and a dot decimal', () => {
    expect(unwrap(formatMoney(123450, 'MAD', 'en'))).toContain('1,234.50');
  });

  it('puts the currency symbol in front of the amount', () => {
    const formatted = unwrap(formatMoney(123450, 'MAD', 'en'));
    expect(formatted.indexOf('MAD')).toBeLessThan(formatted.indexOf('1,234.50'));
  });

  it('prefixes a symbol currency too (EUR)', () => {
    const formatted = unwrap(formatMoney(150000, 'EUR', 'en'));
    expect(formatted.startsWith('€')).toBe(true);
  });
});

describe('Arabic (ar) number formats', () => {
  it('uses the Arabic thousands and decimal separators', () => {
    const formatted = unwrap(formatMoney(123450, 'MAD', 'ar'));
    expect(formatted).toContain(ARABIC_THOUSANDS_SEPARATOR);
    expect(formatted).toContain(ARABIC_DECIMAL_SEPARATOR);
  });

  it('localizes the currency indicator instead of showing the latin code', () => {
    const formatted = unwrap(formatMoney(123450, 'MAD', 'ar'));
    expect(formatted).toContain('د.م.');
    expect(formatted).not.toContain('MAD');
  });

  it('uses Arabic-indic digits throughout', () => {
    const formatted = unwrap(formatMoney(123450, 'MAD', 'ar'));
    expect(formatted).toMatch(/[٠-٩]/);
    expect(formatted).not.toMatch(/[0-9]/);
  });
});
