/**
 * Pure-arithmetic Gregorian <-> Hijri conversion (the "tabular"/"civil" Islamic calendar — a
 * fixed 30-year leap-year cycle, not the moon-sighting-based date religious authorities actually
 * announce). This is a documented **approximation**, off by a day or two from the observed
 * calendar in either direction — good enough to *suggest* activating Ramadan mode a week ahead,
 * never to assert an authoritative start date.
 *
 * Implemented as plain integer math (Julian Day Number round-trip) rather than via `Intl`'s
 * `islamic-civil` calendar support, because Hermes on-device only ships a subset of ICU
 * (`src/i18n/intlPolyfills.ts` already works around missing `RelativeTimeFormat`/`PluralRules`
 * there) — this must work identically with no ICU calendar dependency at all. The algorithm is
 * cross-checked in tests against Node's own `Intl` `islamic-civil` calendar, which is only
 * available under Jest (full ICU), never shipped or relied upon at runtime.
 */

export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

const HIJRI_EPOCH_JDN_OFFSET = 1948440;

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function hijriToJDN(year: number, month: number, day: number): number {
  return (
    Math.floor((11 * year + 3) / 30) +
    354 * year +
    30 * month -
    Math.floor((month - 1) / 2) +
    day +
    HIJRI_EPOCH_JDN_OFFSET -
    385
  );
}

function jdnToHijri(jdn: number): HijriDate {
  let l = jdn - HIJRI_EPOCH_JDN_OFFSET + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

/** A UTC `Date` (time-of-day ignored) to its approximate Hijri calendar date. */
export function gregorianToHijri(date: Date): HijriDate {
  return jdnToHijri(gregorianToJDN(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()));
}

/** The approximate Hijri calendar date to a UTC `Date` (midnight). */
export function hijriToGregorian(hijri: HijriDate): Date {
  const { year, month, day } = jdnToGregorian(hijriToJDN(hijri.year, hijri.month, hijri.day));
  return new Date(Date.UTC(year, month - 1, day));
}

/** Ramadan is the 9th month of the Hijri calendar. */
export const RAMADAN_HIJRI_MONTH = 9;

function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * The approximate Gregorian [start, end] of the Ramadan closest to (at or after) `now` — this
 * year's if it hasn't ended yet, otherwise next year's. `end` is the last day of Ramadan (the day
 * before 1 Shawwal), inclusive.
 */
export function ramadanRangeNear(now: Date): { start: Date; end: Date } {
  const hijriNow = gregorianToHijri(now);

  const rangeForHijriYear = (year: number) => {
    const start = hijriToGregorian({ year, month: RAMADAN_HIJRI_MONTH, day: 1 });
    const shawwalStart = hijriToGregorian({ year, month: RAMADAN_HIJRI_MONTH + 1, day: 1 });
    const end = new Date(shawwalStart);
    end.setUTCDate(end.getUTCDate() - 1);
    return { start, end };
  };

  const today = startOfUTCDay(now);
  const thisYear = rangeForHijriYear(hijriNow.year);
  return thisYear.end.getTime() < today.getTime() ? rangeForHijriYear(hijriNow.year + 1) : thisYear;
}

/** How many whole calendar days from `now` until Ramadan's approximate start (negative once started). */
export function daysUntilRamadan(now: Date): number {
  const { start } = ramadanRangeNear(now);
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Math.round((startOfUTCDay(start).getTime() - startOfUTCDay(now).getTime()) / DAY_MS);
}

/** Suggest activating Ramadan mode from this many days before its approximate start. */
export const RAMADAN_SUGGESTION_WINDOW_DAYS = 7;

/**
 * Whether now is a good moment to suggest activating Ramadan mode: within the week before its
 * approximate start, or any time before its approximate end (in case the household hasn't
 * activated it yet even though Ramadan has already begun). Callers still need to check that no
 * theme is active yet and that the household hasn't already dismissed this year's suggestion.
 */
export function shouldSuggestRamadanActivation(now: Date): boolean {
  const { start, end } = ramadanRangeNear(now);
  const today = startOfUTCDay(now);
  const daysUntilStart = Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return daysUntilStart <= RAMADAN_SUGGESTION_WINDOW_DAYS && end.getTime() >= today.getTime();
}
