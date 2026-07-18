import { shouldSendDebtReminder } from '../debtReminderDecision';

const NOON = new Date('2026-07-15T12:00:00.000Z');

function baseInput() {
  return {
    now: NOON,
    dueDate: '2026-07-15',
    isSettled: false,
    remindedAt: null,
  };
}

describe('shouldSendDebtReminder', () => {
  it('sends a reminder on the due date, unsettled, not yet reminded, outside quiet hours', () => {
    expect(shouldSendDebtReminder(baseInput())).toBe(true);
  });

  it("sends a reminder once the due date has passed too (app wasn't opened on the day itself)", () => {
    expect(
      shouldSendDebtReminder({ ...baseInput(), now: new Date('2026-07-20T12:00:00.000Z') }),
    ).toBe(true);
  });

  it('does not send before the due date', () => {
    expect(
      shouldSendDebtReminder({ ...baseInput(), now: new Date('2026-07-10T12:00:00.000Z') }),
    ).toBe(false);
  });

  it('does not send when no due date was agreed ("pas d\'échéance")', () => {
    expect(shouldSendDebtReminder({ ...baseInput(), dueDate: null })).toBe(false);
  });

  it('does not send once settled', () => {
    expect(shouldSendDebtReminder({ ...baseInput(), isSettled: true })).toBe(false);
  });

  it('does not send twice for the same debt', () => {
    expect(
      shouldSendDebtReminder({ ...baseInput(), remindedAt: '2026-07-15T09:00:00.000Z' }),
    ).toBe(false);
  });

  it('does not send during quiet hours', () => {
    expect(
      shouldSendDebtReminder({ ...baseInput(), now: new Date('2026-07-15T23:00:00.000Z') }),
    ).toBe(false);
  });
});
