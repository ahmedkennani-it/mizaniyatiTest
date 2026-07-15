import type { RecurringRule } from '../../db/repositories';
import { computeDueOccurrenceDates, isRecurringRuleDue } from '../recurringOccurrences';

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    type: 'expense',
    amountMinor: 100000,
    currencyCode: 'MAD',
    categoryId: 'cat-1',
    memberId: 'member-1',
    frequency: 'monthly',
    dayOfMonth: 1,
    weekday: null,
    startDate: '2026-07-01',
    endDate: null,
    mode: 'prompt',
    paused: false,
    lastRunDate: null,
    note: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeDueOccurrenceDates', () => {
  it('proposes the occurrence once the due date arrives (monthly, prompt mode)', () => {
    const rule = makeRule({ startDate: '2026-07-01', dayOfMonth: 1 });

    expect(computeDueOccurrenceDates(rule, new Date('2026-07-01T09:00:00.000Z'))).toEqual(['2026-07-01']);
  });

  it('is not yet due before its start date', () => {
    const rule = makeRule({ startDate: '2026-08-01', dayOfMonth: 1 });

    expect(computeDueOccurrenceDates(rule, new Date('2026-07-15T09:00:00.000Z'))).toEqual([]);
  });

  it('skips the configured day in the start month if it falls before startDate', () => {
    // dayOfMonth=5 but the rule only starts on the 20th — the 5th of the start month is in the
    // past relative to the rule's own creation, so the first real occurrence is next month.
    const rule = makeRule({ startDate: '2026-07-20', dayOfMonth: 5 });

    expect(computeDueOccurrenceDates(rule, new Date('2026-08-31T00:00:00.000Z'))).toEqual(['2026-08-05']);
  });

  it('a paused rule never proposes/creates a transaction', () => {
    const rule = makeRule({ paused: true, startDate: '2026-06-01', dayOfMonth: 1 });

    expect(computeDueOccurrenceDates(rule, new Date('2026-09-01T00:00:00.000Z'))).toEqual([]);
  });

  it('catches up every missed month offline without duplicating an already-run date', () => {
    const rule = makeRule({ startDate: '2026-04-01', dayOfMonth: 1, lastRunDate: '2026-05-01' });

    const due = computeDueOccurrenceDates(rule, new Date('2026-08-15T00:00:00.000Z'));

    // April and May are before/at lastRunDate, so only June/July/August are still due.
    expect(due).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
  });

  it('clamps day 31 to the last day of a shorter month (cas limite)', () => {
    const rule = makeRule({ startDate: '2026-01-31', dayOfMonth: 31 });

    const due = computeDueOccurrenceDates(rule, new Date('2026-02-28T00:00:00.000Z'));

    expect(due).toEqual(['2026-01-31', '2026-02-28']);
  });

  it('stops proposing once the end date has passed', () => {
    const rule = makeRule({ startDate: '2026-06-01', dayOfMonth: 1, endDate: '2026-07-01' });

    const due = computeDueOccurrenceDates(rule, new Date('2026-09-01T00:00:00.000Z'));

    expect(due).toEqual(['2026-06-01', '2026-07-01']);
  });

  it('supports weekly frequency on the configured weekday', () => {
    // 2026-07-03 is a Friday (weekday 5).
    const rule = makeRule({
      frequency: 'weekly',
      dayOfMonth: null,
      weekday: 5,
      startDate: '2026-07-01',
    });

    const due = computeDueOccurrenceDates(rule, new Date('2026-07-17T00:00:00.000Z'));

    expect(due).toEqual(['2026-07-03', '2026-07-10', '2026-07-17']);
  });

  it('returns an empty array once every occurrence up to now has already run', () => {
    const rule = makeRule({ startDate: '2026-07-01', dayOfMonth: 1, lastRunDate: '2026-07-01' });

    expect(computeDueOccurrenceDates(rule, new Date('2026-07-20T00:00:00.000Z'))).toEqual([]);
  });
});

describe('isRecurringRuleDue', () => {
  it('is true when at least one occurrence is due', () => {
    const rule = makeRule({ startDate: '2026-07-01', dayOfMonth: 1 });
    expect(isRecurringRuleDue(rule, new Date('2026-07-01T00:00:00.000Z'))).toBe(true);
  });

  it('is false when nothing is due yet', () => {
    const rule = makeRule({ startDate: '2026-08-01', dayOfMonth: 1 });
    expect(isRecurringRuleDue(rule, new Date('2026-07-01T00:00:00.000Z'))).toBe(false);
  });
});
