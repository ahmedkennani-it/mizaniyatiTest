import type { RecurringRule } from '../db/repositories';

const MAX_ITERATIONS = 1200; // 100 years of monthly/weekly stepping — a generous safety cap.

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last calendar day of `monthIndex0` (0-11) in `year`, for the day-31-in-February fallback. */
function lastDayOfMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/**
 * The monthly occurrence date for `year`/`monthIndex0`, clamping `dayOfMonth` down to that
 * month's last day (e.g. day 31 becomes Feb 28/29) — "mois plus courts → dernier jour du mois"
 * from `docs/specs/transactions-recurrentes.md`'s cas limites.
 */
function monthlyOccurrence(year: number, monthIndex0: number, dayOfMonth: number): string {
  const day = Math.min(dayOfMonth, lastDayOfMonth(year, monthIndex0));
  return toIsoDate(new Date(Date.UTC(year, monthIndex0, day)));
}

/** The first date on/after `start` that falls on `weekday` (0=Sunday..6=Saturday). */
function firstWeeklyOccurrence(start: Date, weekday: number): Date {
  const aligned = new Date(start);
  const diff = (weekday - aligned.getUTCDay() + 7) % 7;
  aligned.setUTCDate(aligned.getUTCDate() + diff);
  return aligned;
}

/**
 * Every occurrence date for `rule` that is due (on or before `asOfDate`) and hasn't already been
 * run — the computational core of "proposer/ajouter la transaction à échéance" (US-021,
 * `docs/specs/transactions-recurrentes.md`). Turning a due date into an actual `Transaction` row
 * (auto mode) or a confirm/modify/ignore prompt (prompt mode) is the runtime that consumes this;
 * this function only answers "which dates are due right now".
 *
 * - **Paused rules never have due dates** ("Given une règle sur pause... Then aucune transaction
 *   n'est proposée/créée").
 * - **Rattrapage sans doublon**: every missed date between `rule.lastRunDate` (exclusive) and
 *   `asOfDate` (inclusive) is returned, in ascending order, so a caller that iterates them and
 *   advances `lastRunDate` after each one never re-proposes/re-creates the same date twice —
 *   whether the app was closed for a day or a year.
 * - Dates before `rule.startDate` or after `rule.endDate` are never due.
 */
export function computeDueOccurrenceDates(rule: RecurringRule, asOfDate: Date): string[] {
  if (rule.paused) {
    return [];
  }

  const asOf = toIsoDate(asOfDate);
  if (asOf < rule.startDate) {
    return [];
  }

  const notBefore = rule.lastRunDate;
  const notAfter = rule.endDate;
  const due: string[] = [];

  if (rule.frequency === 'monthly') {
    const dayOfMonth = rule.dayOfMonth ?? 1;
    let year = Number(rule.startDate.slice(0, 4));
    let monthIndex0 = Number(rule.startDate.slice(5, 7)) - 1;

    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
      const occurrence = monthlyOccurrence(year, monthIndex0, dayOfMonth);
      if (occurrence > asOf) {
        break;
      }
      if (
        occurrence >= rule.startDate &&
        (!notAfter || occurrence <= notAfter) &&
        (!notBefore || occurrence > notBefore)
      ) {
        due.push(occurrence);
      }
      monthIndex0 += 1;
      if (monthIndex0 > 11) {
        monthIndex0 = 0;
        year += 1;
      }
    }
  } else {
    const weekday = rule.weekday ?? 0;
    let cursor = firstWeeklyOccurrence(new Date(`${rule.startDate}T00:00:00.000Z`), weekday);

    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
      const occurrence = toIsoDate(cursor);
      if (occurrence > asOf) {
        break;
      }
      if (
        occurrence >= rule.startDate &&
        (!notAfter || occurrence <= notAfter) &&
        (!notBefore || occurrence > notBefore)
      ) {
        due.push(occurrence);
      }
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  return due;
}

/** Convenience wrapper for UI code that only needs a yes/no, not the actual dates. */
export function isRecurringRuleDue(rule: RecurringRule, asOfDate: Date): boolean {
  return computeDueOccurrenceDates(rule, asOfDate).length > 0;
}
