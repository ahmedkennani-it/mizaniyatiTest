import { shouldSendTontineReminder } from '../tontineReminderDecision';

const NOON = new Date('2026-07-15T12:00:00.000Z');

function baseInput() {
  return {
    enabled: true,
    now: NOON,
    alreadyRemindedThisMonth: false,
    isCurrentRoundThisMonth: true,
    selfPaymentStatus: 'pending' as const,
  };
}

describe('shouldSendTontineReminder', () => {
  it('sends a reminder when enabled, due this month, unpaid, not yet reminded, outside quiet hours', () => {
    expect(shouldSendTontineReminder(baseInput())).toBe(true);
  });

  it('does not send when the group opted out', () => {
    expect(shouldSendTontineReminder({ ...baseInput(), enabled: false })).toBe(false);
  });

  it('does not send twice in the same month', () => {
    expect(shouldSendTontineReminder({ ...baseInput(), alreadyRemindedThisMonth: true })).toBe(
      false,
    );
  });

  it('does not send when the current round is not this month', () => {
    expect(shouldSendTontineReminder({ ...baseInput(), isCurrentRoundThisMonth: false })).toBe(
      false,
    );
  });

  it('does not send once self has already paid', () => {
    expect(shouldSendTontineReminder({ ...baseInput(), selfPaymentStatus: 'paid' })).toBe(false);
  });

  it('does not send during quiet hours', () => {
    expect(
      shouldSendTontineReminder({ ...baseInput(), now: new Date('2026-07-15T23:00:00.000Z') }),
    ).toBe(false);
  });
});
