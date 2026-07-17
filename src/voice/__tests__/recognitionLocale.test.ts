import { recognitionLocale } from '../recognitionLocale';

describe('recognitionLocale', () => {
  it('reuses the same market locale the number/date formatters resolve for the app language', () => {
    expect(recognitionLocale('fr')).toBe('fr-MA');
    expect(recognitionLocale('ar')).toBe('ar-MA');
    expect(recognitionLocale('en')).toBe('en-US');
  });
});
