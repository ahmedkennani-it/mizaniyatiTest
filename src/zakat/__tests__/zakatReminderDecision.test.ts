import { shouldSendZakatReminder } from '../zakatReminderDecision';

const NOON = new Date('2026-07-15T12:00:00.000Z');

function baseInput() {
  return {
    now: NOON,
    dueDate: '2026-07-15',
    paidAt: null,
    remindedAt: null,
  };
}

describe('shouldSendZakatReminder', () => {
  it('sends a reminder on the due date, unpaid, not yet reminded, outside quiet hours', () => {
    expect(shouldSendZakatReminder(baseInput())).toBe(true);
  });

  it('sends a reminder once the due date has passed too (app wasn\'t opened on the day itself)', () => {
    expect(
      shouldSendZakatReminder({ ...baseInput(), now: new Date('2026-07-20T12:00:00.000Z') }),
    ).toBe(true);
  });

  it('does not send before the due date', () => {
    expect(
      shouldSendZakatReminder({ ...baseInput(), now: new Date('2026-07-10T12:00:00.000Z') }),
    ).toBe(false);
  });

  it('does not send when no due date was planned', () => {
    expect(shouldSendZakatReminder({ ...baseInput(), dueDate: null })).toBe(false);
  });

  it('does not send once already paid', () => {
    expect(shouldSendZakatReminder({ ...baseInput(), paidAt: '2026-07-15T09:00:00.000Z' })).toBe(
      false,
    );
  });

  it('does not send twice for the same plan', () => {
    expect(
      shouldSendZakatReminder({ ...baseInput(), remindedAt: '2026-07-15T09:00:00.000Z' }),
    ).toBe(false);
  });

  it('does not send during quiet hours', () => {
    expect(
      shouldSendZakatReminder({ ...baseInput(), now: new Date('2026-07-15T23:00:00.000Z') }),
    ).toBe(false);
  });
});
