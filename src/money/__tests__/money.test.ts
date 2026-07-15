import {
  DEFAULT_CURRENCY_CODE,
  formatMoney,
  parseAmountInput,
  parseNonNegativeAmountInput,
  toMajorUnits,
} from '../money';

describe('DEFAULT_CURRENCY_CODE', () => {
  it('defaults to MAD (Morocco launch market)', () => {
    expect(DEFAULT_CURRENCY_CODE).toBe('MAD');
  });
});

describe('toMajorUnits', () => {
  it('divides by 100 for a 2-decimal currency (MAD)', () => {
    expect(toMajorUnits(123450, 'MAD')).toBeCloseTo(1234.5);
  });

  it('does not divide for a 0-decimal currency (JPY)', () => {
    expect(toMajorUnits(1234, 'JPY')).toBe(1234);
  });

  it('divides by 1000 for a 3-decimal currency (BHD)', () => {
    expect(toMajorUnits(1234500, 'BHD')).toBeCloseTo(1234.5);
  });
});

describe('formatMoney', () => {
  it('formats MAD amounts for French with a period thousands separator and comma decimal', () => {
    expect(formatMoney(123450, 'MAD', 'fr')).toMatch(/1.234,50.*MAD/);
  });

  it('formats MAD amounts for Arabic with Arabic-indic digits', () => {
    const formatted = formatMoney(123450, 'MAD', 'ar');
    expect(formatted).toMatch(/[٠-٩]/);
    expect(formatted).not.toMatch(/[0-9]/);
  });

  it('wraps the formatted amount in LTR marks so it reads correctly inside RTL text', () => {
    const formatted = formatMoney(123450, 'MAD', 'ar');
    const LEFT_TO_RIGHT_MARK = '‎';
    expect(formatted.startsWith(LEFT_TO_RIGHT_MARK)).toBe(true);
    expect(formatted.endsWith(LEFT_TO_RIGHT_MARK)).toBe(true);
  });

  it('formats a non-default currency without any conversion (no silent MAD conversion)', () => {
    expect(formatMoney(150000, 'EUR', 'fr')).toMatch(/1.500,00.*€/);
  });
});

describe('parseAmountInput', () => {
  it('parses a period-decimal amount into minor units for a 2-decimal currency', () => {
    expect(parseAmountInput('42.50', 'MAD')).toBe(4250);
  });

  it('parses a comma-decimal amount into minor units', () => {
    expect(parseAmountInput('42,50', 'MAD')).toBe(4250);
  });

  it('parses a whole number for a 0-decimal currency (JPY) without dividing', () => {
    expect(parseAmountInput('1234', 'JPY')).toBe(1234);
  });

  it('rounds to the nearest minor unit', () => {
    expect(parseAmountInput('10.005', 'MAD')).toBe(1001);
  });

  it('rejects an empty string', () => {
    expect(parseAmountInput('', 'MAD')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(parseAmountInput('abc', 'MAD')).toBeNull();
  });

  it('rejects zero', () => {
    expect(parseAmountInput('0', 'MAD')).toBeNull();
  });

  it('rejects a negative amount', () => {
    expect(parseAmountInput('-5', 'MAD')).toBeNull();
  });
});

describe('parseNonNegativeAmountInput', () => {
  it('accepts zero', () => {
    expect(parseNonNegativeAmountInput('0', 'MAD')).toBe(0);
  });

  it('treats an empty string as zero', () => {
    expect(parseNonNegativeAmountInput('', 'MAD')).toBe(0);
  });

  it('parses a positive amount like parseAmountInput', () => {
    expect(parseNonNegativeAmountInput('42.50', 'MAD')).toBe(4250);
  });

  it('rejects a negative amount', () => {
    expect(parseNonNegativeAmountInput('-5', 'MAD')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(parseNonNegativeAmountInput('abc', 'MAD')).toBeNull();
  });
});
