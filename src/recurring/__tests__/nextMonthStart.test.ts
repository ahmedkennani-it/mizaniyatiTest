import { nextMonthStart } from '../nextMonthStart';

describe('nextMonthStart', () => {
  it('returns the first day of the following month', () => {
    expect(nextMonthStart('2026-07-16')).toBe('2026-08-01');
  });

  it('wraps December into January of the next year', () => {
    expect(nextMonthStart('2026-12-25')).toBe('2027-01-01');
  });

  it('is stable regardless of the day within the month', () => {
    expect(nextMonthStart('2026-02-01')).toBe('2026-03-01');
    expect(nextMonthStart('2026-02-28')).toBe('2026-03-01');
  });
});
