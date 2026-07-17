import { buildCalendarGrid, nextMonthKey, previousMonthKey } from '../calendarGrid';

describe('buildCalendarGrid', () => {
  it('pads the leading blanks so the 1st lands on its real weekday', () => {
    // 2026-07-01 is a Wednesday (weekday 3).
    const grid = buildCalendarGrid('2026-07', '2026-07-16');
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toMatchObject({ date: '2026-07-01' });
  });

  it('lists every day of the month, none more or less', () => {
    const grid = buildCalendarGrid('2026-07', '2026-07-16');
    const dates = grid.filter((cell) => cell !== null).map((cell) => cell!.date);
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe('2026-07-01');
    expect(dates[dates.length - 1]).toBe('2026-07-31');
  });

  it('handles a shorter month correctly (February, non-leap year)', () => {
    const grid = buildCalendarGrid('2026-02', '2026-02-01');
    const dates = grid.filter((cell) => cell !== null).map((cell) => cell!.date);
    expect(dates).toHaveLength(28);
  });

  /** US-019: "une date future est refusée" — the picker marks them so it can disable them. */
  it('flags days after `today` as future', () => {
    const grid = buildCalendarGrid('2026-07', '2026-07-16');
    const day15 = grid.find((cell) => cell?.date === '2026-07-15');
    const day16 = grid.find((cell) => cell?.date === '2026-07-16');
    const day17 = grid.find((cell) => cell?.date === '2026-07-17');
    expect(day15?.isFuture).toBe(false);
    expect(day16?.isFuture).toBe(false);
    expect(day17?.isFuture).toBe(true);
  });

  it('flags exactly one cell as today', () => {
    const grid = buildCalendarGrid('2026-07', '2026-07-16');
    const todays = grid.filter((cell) => cell?.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0]?.date).toBe('2026-07-16');
  });

  it('flags nothing as today when viewing a different month', () => {
    const grid = buildCalendarGrid('2026-06', '2026-07-16');
    expect(grid.some((cell) => cell?.isToday)).toBe(false);
  });
});

describe('nextMonthKey / previousMonthKey', () => {
  it('steps forward within a year', () => {
    expect(nextMonthKey('2026-07')).toBe('2026-08');
  });

  it('steps forward across a year boundary', () => {
    expect(nextMonthKey('2026-12')).toBe('2027-01');
  });

  it('steps backward within a year', () => {
    expect(previousMonthKey('2026-07')).toBe('2026-06');
  });

  it('steps backward across a year boundary', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12');
  });
});
