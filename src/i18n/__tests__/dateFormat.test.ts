import { formatLongDate, formatMonthLabel, monthKeyOf, monthKeyToDate } from '../dateFormat';

describe('monthKeyOf / monthKeyToDate', () => {
  it('round-trips a YYYY-MM key through a first-of-month date', () => {
    expect(monthKeyOf(monthKeyToDate('2026-06'))).toBe('2026-06');
  });

  it('zero-pads single-digit months', () => {
    expect(monthKeyOf(new Date(2026, 0, 15))).toBe('2026-01');
  });

  it('resolves the key in local time, not UTC (no off-by-one month)', () => {
    const date = monthKeyToDate('2026-06');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(1);
  });
});

/** US-062: "les mois sont affichés dans la langue active (Juin / يونيو / June)". */
describe('formatMonthLabel', () => {
  it('names the month in French', () => {
    expect(formatMonthLabel('2026-06', 'fr')).toBe('juin 2026');
  });

  it('names the month in English', () => {
    expect(formatMonthLabel('2026-06', 'en')).toBe('June 2026');
  });

  it('names the month in Arabic, with Arabic-indic digits for the year', () => {
    const label = formatMonthLabel('2026-06', 'ar');
    expect(label).toContain('يونيو');
    expect(label).toMatch(/[٠-٩]/);
    expect(label).not.toMatch(/[0-9]/);
  });

  it('falls back to the raw key rather than throwing on a malformed month', () => {
    expect(formatMonthLabel('not-a-month', 'fr')).toBe('not-a-month');
  });
});

describe('formatLongDate', () => {
  it('spells the month out in the active language', () => {
    const date = new Date(2026, 5, 15);
    expect(formatLongDate(date, 'fr')).toContain('juin');
    expect(formatLongDate(date, 'en')).toContain('June');
    expect(formatLongDate(date, 'ar')).toContain('يونيو');
  });
});
