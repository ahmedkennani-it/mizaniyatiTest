import { extractAmountFromDictation } from '../extractAmountFromDictation';

describe('extractAmountFromDictation — French', () => {
  it('extracts the amount from the reference sentence (US-021a)', () => {
    expect(extractAmountFromDictation('Quarante-deux dirhams de café', 'fr')).toBe(42);
  });

  it('handles the teens', () => {
    expect(extractAmountFromDictation('quinze dirhams', 'fr')).toBe(15);
  });

  it('handles the regular 17-19 range (dix + unit, additive)', () => {
    expect(extractAmountFromDictation('dix-neuf euros', 'fr')).toBe(19);
  });

  it('handles the irregular quatre-vingt(s) range (4×20, not 4+20)', () => {
    expect(extractAmountFromDictation('quatre-vingts dirhams', 'fr')).toBe(80);
    expect(extractAmountFromDictation('quatre-vingt-dix-neuf dirhams', 'fr')).toBe(99);
    expect(extractAmountFromDictation('quatre-vingt-un dirhams', 'fr')).toBe(81);
  });

  it('handles hundreds and thousands', () => {
    expect(extractAmountFromDictation('cent cinquante dirhams', 'fr')).toBe(150);
    expect(extractAmountFromDictation('deux mille cent dirhams', 'fr')).toBe(2100);
  });

  it('handles a decimal amount (cents)', () => {
    expect(extractAmountFromDictation('quarante-deux virgule cinquante dirhams', 'fr')).toBe(42.5);
  });

  it('returns null when no amount is said', () => {
    expect(extractAmountFromDictation('Café et croissant', 'fr')).toBeNull();
  });
});

describe('extractAmountFromDictation — English', () => {
  it('extracts the amount from the reference sentence, translated', () => {
    expect(extractAmountFromDictation('Forty-two dirhams for coffee', 'en')).toBe(42);
  });

  it('handles the teens', () => {
    expect(extractAmountFromDictation('nineteen dollars', 'en')).toBe(19);
  });

  it('handles the regular tens range', () => {
    expect(extractAmountFromDictation('ninety-nine dirhams', 'en')).toBe(99);
  });

  it('handles hundreds and thousands, with "and"', () => {
    expect(extractAmountFromDictation('one hundred and fifty dirhams', 'en')).toBe(150);
    expect(extractAmountFromDictation('two thousand one hundred dirhams', 'en')).toBe(2100);
  });

  it('handles a decimal amount (cents)', () => {
    expect(extractAmountFromDictation('forty-two point fifty dirhams', 'en')).toBe(42.5);
  });

  it('returns null when no amount is said', () => {
    expect(extractAmountFromDictation('Coffee and croissant', 'en')).toBeNull();
  });
});

describe('extractAmountFromDictation — Arabic', () => {
  it('extracts the amount from the reference sentence, translated', () => {
    expect(extractAmountFromDictation('اثنان وأربعون درهماً للقهوة', 'ar')).toBe(42);
  });

  it('handles the teens (compound أحد عشر-style forms)', () => {
    expect(extractAmountFromDictation('خمسة عشر درهماً', 'ar')).toBe(15);
  });

  it('handles the regular tens range, "و" spelled apart', () => {
    expect(extractAmountFromDictation('تسعة و تسعون درهماً', 'ar')).toBe(99);
  });

  it('handles hundreds and thousands', () => {
    expect(extractAmountFromDictation('مئة وخمسون درهماً', 'ar')).toBe(150);
    expect(extractAmountFromDictation('اثنان ألف ومئة درهم', 'ar')).toBe(2100);
  });

  it('handles a decimal amount (cents)', () => {
    expect(extractAmountFromDictation('اثنان وأربعون فاصلة خمسون درهماً', 'ar')).toBe(42.5);
  });

  it('returns null when no amount is said', () => {
    expect(extractAmountFromDictation('قهوة وكرواسون', 'ar')).toBeNull();
  });
});

describe('extractAmountFromDictation — digit fallback (any language)', () => {
  it('prefers a literal digit substring over word parsing when both could apply', () => {
    expect(extractAmountFromDictation('42 dirhams', 'fr')).toBe(42);
    expect(extractAmountFromDictation('42 dirhams', 'en')).toBe(42);
    expect(extractAmountFromDictation('42 درهم', 'ar')).toBe(42);
  });

  it('accepts a decimal digit amount with either separator', () => {
    expect(extractAmountFromDictation('42.50 dirhams', 'en')).toBe(42.5);
    expect(extractAmountFromDictation('42,50 dirhams', 'fr')).toBe(42.5);
  });
});

describe('extractAmountFromDictation — no detection (US-021a fallback)', () => {
  it.each(['fr', 'en', 'ar'] as const)('returns null for an empty transcript (%s)', (language) => {
    expect(extractAmountFromDictation('', language)).toBeNull();
  });

  it.each(['fr', 'en', 'ar'] as const)('returns null for a zero amount (%s)', (language) => {
    expect(extractAmountFromDictation('0', language)).toBeNull();
  });
});
