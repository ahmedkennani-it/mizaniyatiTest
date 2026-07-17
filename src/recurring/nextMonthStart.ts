/**
 * The first day of the month after `dateIso` ("2026-07-16" → "2026-08-01"), wrapping the year at
 * December. Used as a recurring rule's `startDate` when it's created from an already-entered
 * transaction (US-023): the transaction that prompted the rule already covers its own month, so
 * the rule must not also propose that same month again — starting it next month is what makes
 * "propose it again next month" true rather than "propose a duplicate right away".
 */
export function nextMonthStart(dateIso: string): string {
  const year = Number(dateIso.slice(0, 4));
  const month = Number(dateIso.slice(5, 7));
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}
