jest.mock('../../notifications', () => {
  const actual = jest.requireActual('../../notifications');
  return { ...actual, notificationClient: { presentNow: jest.fn() } };
});

// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createZakatAssessment, listZakatAssessments } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { notificationClient } from '../../notifications';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { processZakatReminders } from '../processZakatReminders';

const NOON = new Date('2026-07-15T12:00:00.000Z');

function assessmentInput(dueDate: string | null) {
  return {
    cashMinor: 1000000,
    goldSilverMinor: 0,
    investmentsMinor: 0,
    debtsMinor: 0,
    baseMinor: 1000000,
    dueMinor: 25000,
    aboveNisab: true,
    dueDate,
  };
}

describe('processZakatReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a reminder once the due date has arrived', async () => {
    const { db } = createFakeDatabase();
    const assessment = await createZakatAssessment(db, assessmentInput('2026-07-15'));

    await processZakatReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
    const updated = (await listZakatAssessments(db)).find((a) => a.id === assessment.id);
    expect(updated?.remindedAt).not.toBeNull();
  });

  it('does not send before the due date', async () => {
    const { db } = createFakeDatabase();
    await createZakatAssessment(db, assessmentInput('2026-08-01'));

    await processZakatReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send when no due date was planned', async () => {
    const { db } = createFakeDatabase();
    await createZakatAssessment(db, assessmentInput(null));

    await processZakatReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send twice for the same plan', async () => {
    const { db } = createFakeDatabase();
    await createZakatAssessment(db, assessmentInput('2026-07-15'));

    await processZakatReminders(db, NOON);
    await processZakatReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
  });
});
