import {
  formatLongDate,
  formatMonthLabel,
  formatRelativeDate,
  monthKeyOf,
  monthKeyToDate,
} from '../dateFormat';

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

/** US-074b: transaction rows show "aujourd'hui / hier / il y a 3 jours", not a raw date. */
describe('formatRelativeDate', () => {
  const now = new Date(2026, 6, 16, 10, 0);

  it.each([
    [0, 'aujourd’hui'],
    [1, 'hier'],
    [3, 'il y a 3 jours'],
    [7, 'il y a 7 jours'],
  ])('renders %s day(s) ago in French', (daysAgo, expected) => {
    const date = new Date(2026, 6, 16 - daysAgo, 10, 0);
    expect(formatRelativeDate(date, 'fr', now)).toBe(expected);
  });

  it('renders relative days in Arabic with Arabic-indic digits', () => {
    const label = formatRelativeDate(new Date(2026, 6, 13, 10, 0), 'ar', now);
    expect(label).toContain('٣');
    expect(label).not.toMatch(/[0-9]/);
  });

  it('renders relative days in English', () => {
    expect(formatRelativeDate(new Date(2026, 6, 15, 10, 0), 'en', now)).toBe('yesterday');
  });

  // Counted on calendar days, not elapsed hours: 23:00 yesterday is "hier", not "il y a 0 jour".
  it('treats late yesterday as yesterday, not as today', () => {
    expect(formatRelativeDate(new Date(2026, 6, 15, 23, 0), 'fr', now)).toBe('hier');
  });

  it('treats early today as today', () => {
    expect(formatRelativeDate(new Date(2026, 6, 16, 0, 30), 'fr', now)).toBe('aujourd’hui');
  });

  // Past a week, "il y a 5 semaines" is harder to place than the date itself.
  it('falls back to the short date beyond a week', () => {
    expect(formatRelativeDate(new Date(2026, 5, 1, 10, 0), 'fr', now)).toBe('01/06/2026');
  });

  it('falls back to the short date for a future date rather than saying "dans 4 semaines"', () => {
    expect(formatRelativeDate(new Date(2026, 7, 20, 10, 0), 'fr', now)).toBe('20/08/2026');
  });
});
