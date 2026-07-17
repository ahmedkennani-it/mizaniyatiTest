export interface CalendarCell {
  /** ISO date, e.g. "2026-07-16". */
  date: string;
  /** Relative to `today` — the picker disables these (US-019: "une date future est refusée"). */
  isFuture: boolean;
  isToday: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * A `monthKey`'s ("2026-07") days as a flat, Sunday-first grid — `null` for the leading blanks
 * before the 1st falls on its weekday. Callers chunk this into rows of 7 for rendering; kept flat
 * here since the row width is a display concern, not a calendar-math one.
 */
export function buildCalendarGrid(monthKey: string, today: string): (CalendarCell | null)[] {
  const [year, month] = monthKey.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    cells.push({ date, isFuture: date > today, isToday: date === today });
  }
  return cells;
}

/** "2026-07" → "2026-08", "2026-12" → "2027-01". */
export function nextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
}

/** "2026-07" → "2026-06", "2026-01" → "2025-12". */
export function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
}
