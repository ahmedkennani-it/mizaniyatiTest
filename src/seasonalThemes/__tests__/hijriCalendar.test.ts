import {
  RAMADAN_HIJRI_MONTH,
  daysUntilRamadan,
  gregorianToHijri,
  hijriToGregorian,
  ramadanRangeNear,
  shouldSuggestRamadanActivation,
} from '../hijriCalendar';

/**
 * Node's `Intl` ships full ICU under Jest, including the `islamic-civil` calendar — the exact
 * "tabular" Islamic calendar this module hand-implements in pure arithmetic (so it works
 * identically on Hermes, which does not ship that calendar; see the module's own top comment).
 * This oracle is only ever used here, to verify the arithmetic — never at runtime.
 */
function intlIslamicCivil(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-civil', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

const SAMPLE_DATES: [number, number, number][] = [
  [2024, 3, 11],
  [2024, 4, 10],
  [2026, 7, 17],
  [2000, 1, 1],
  [1990, 6, 15],
  [2030, 12, 31],
  [1975, 8, 8],
];

describe('gregorianToHijri', () => {
  it.each(SAMPLE_DATES)('matches Intl islamic-civil for %d-%d-%d', (year, month, day) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    expect(gregorianToHijri(date)).toEqual(intlIslamicCivil(date));
  });
});

describe('hijriToGregorian', () => {
  it('round-trips through gregorianToHijri for a range of dates', () => {
    for (const [year, month, day] of SAMPLE_DATES) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const hijri = gregorianToHijri(date);
      expect(hijriToGregorian(hijri)).toEqual(date);
    }
  });
});

describe('ramadanRangeNear', () => {
  it('returns a ~29-30 day range starting at Hijri month 9, day 1', () => {
    const { start, end } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    expect(gregorianToHijri(start)).toEqual({ year: 1445, month: RAMADAN_HIJRI_MONTH, day: 1 });
    const lengthDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    expect(lengthDays === 29 || lengthDays === 30).toBe(true);
  });

  it('rolls over to next Hijri year once this one\'s Ramadan has ended', () => {
    const midYear = new Date('2024-01-01T00:00:00.000Z');
    const { end } = ramadanRangeNear(midYear);
    const dayAfterEnd = new Date(end);
    dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);

    const nextRange = ramadanRangeNear(dayAfterEnd);
    expect(nextRange.start.getTime()).toBeGreaterThan(end.getTime());
  });
});

describe('daysUntilRamadan', () => {
  it('is exactly 0 on the approximate start day', () => {
    const { start } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    expect(daysUntilRamadan(start)).toBe(0);
  });

  it('is negative once Ramadan has started', () => {
    const { start } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    const dayAfterStart = new Date(start);
    dayAfterStart.setUTCDate(dayAfterStart.getUTCDate() + 1);
    expect(daysUntilRamadan(dayAfterStart)).toBe(-1);
  });
});

describe('shouldSuggestRamadanActivation', () => {
  it('is false far before Ramadan', () => {
    const { start } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    const farBefore = new Date(start);
    farBefore.setUTCDate(farBefore.getUTCDate() - 30);
    expect(shouldSuggestRamadanActivation(farBefore)).toBe(false);
  });

  it('is true within the week before the approximate start', () => {
    const { start } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    const threeDaysBefore = new Date(start);
    threeDaysBefore.setUTCDate(threeDaysBefore.getUTCDate() - 3);
    expect(shouldSuggestRamadanActivation(threeDaysBefore)).toBe(true);
  });

  it('is true during Ramadan itself', () => {
    const { start } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    const midRamadan = new Date(start);
    midRamadan.setUTCDate(midRamadan.getUTCDate() + 10);
    expect(shouldSuggestRamadanActivation(midRamadan)).toBe(true);
  });

  it('is false once Ramadan has ended', () => {
    const { end } = ramadanRangeNear(new Date('2024-01-01T00:00:00.000Z'));
    const afterEnd = new Date(end);
    afterEnd.setUTCDate(afterEnd.getUTCDate() + 1);
    expect(shouldSuggestRamadanActivation(afterEnd)).toBe(false);
  });
});
