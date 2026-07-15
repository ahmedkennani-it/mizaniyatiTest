import type { CategoryBudgetStatus } from '../../categories';
import { isWithinQuietHours, shouldSendBudgetAlert } from '../budgetAlertDecision';

function makeStatus(overrides: Partial<CategoryBudgetStatus> = {}): CategoryBudgetStatus {
  return {
    capMinor: 100000,
    alertThresholdMinor: 80000,
    spentMinor: 90000,
    percentage: 90,
    isOverBudget: false,
    overageMinor: 0,
    rolloverMinor: 0,
    ...overrides,
  };
}

describe('isWithinQuietHours', () => {
  it('is true late at night and early morning (22h–7h default window)', () => {
    expect(isWithinQuietHours(new Date(2026, 0, 1, 23, 0))).toBe(true);
    expect(isWithinQuietHours(new Date(2026, 0, 1, 6, 59))).toBe(true);
  });

  it('is false during the day', () => {
    expect(isWithinQuietHours(new Date(2026, 0, 1, 14, 0))).toBe(false);
    expect(isWithinQuietHours(new Date(2026, 0, 1, 7, 0))).toBe(false);
    expect(isWithinQuietHours(new Date(2026, 0, 1, 21, 59))).toBe(false);
  });
});

describe('shouldSendBudgetAlert', () => {
  const daytime = new Date(2026, 0, 1, 14, 0);
  const nighttime = new Date(2026, 0, 1, 23, 0);

  it('does not send when notifications are opted out', () => {
    expect(
      shouldSendBudgetAlert({
        enabled: false,
        now: daytime,
        budgetStatus: makeStatus(),
        alreadyAlertedThisMonth: false,
      }),
    ).toBe(false);
  });

  it('does not send when the threshold has not been reached yet', () => {
    expect(
      shouldSendBudgetAlert({
        enabled: true,
        now: daytime,
        budgetStatus: makeStatus({ spentMinor: 50000 }),
        alreadyAlertedThisMonth: false,
      }),
    ).toBe(false);
  });

  it('does not send again once already alerted this month (no spam)', () => {
    expect(
      shouldSendBudgetAlert({
        enabled: true,
        now: daytime,
        budgetStatus: makeStatus({ spentMinor: 130000 }),
        alreadyAlertedThisMonth: true,
      }),
    ).toBe(false);
  });

  it('respects quiet hours even when everything else qualifies', () => {
    expect(
      shouldSendBudgetAlert({
        enabled: true,
        now: nighttime,
        budgetStatus: makeStatus({ spentMinor: 130000 }),
        alreadyAlertedThisMonth: false,
      }),
    ).toBe(false);
  });

  it('sends once the alert threshold is reached, opted in, outside quiet hours, not yet alerted', () => {
    expect(
      shouldSendBudgetAlert({
        enabled: true,
        now: daytime,
        budgetStatus: makeStatus({ spentMinor: 80000 }),
        alreadyAlertedThisMonth: false,
      }),
    ).toBe(true);
  });
});
