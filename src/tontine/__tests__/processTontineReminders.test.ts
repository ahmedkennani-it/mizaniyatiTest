jest.mock('../../notifications', () => {
  const actual = jest.requireActual('../../notifications');
  return { ...actual, notificationClient: { presentNow: jest.fn() } };
});

// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import {
  listTontineGroups,
  updateTontineGroup,
  updateTontinePayment,
  listTontinePayments,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { notificationClient } from '../../notifications';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createTontineGroupWithMembers } from '../createTontineGroupWithMembers';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { processTontineReminders } from '../processTontineReminders';

const NOON = new Date('2026-07-15T12:00:00.000Z');

async function seedGroup(
  db: ReturnType<typeof createFakeDatabase>['db'],
  reminderEnabled: boolean,
) {
  const { group } = await createTontineGroupWithMembers(db, {
    name: 'Tontine famille',
    contributionPerRoundMinor: 100000,
    currencyCode: 'MAD',
    startMonth: '2026-07',
    memberNames: ['Youssef', 'Salma'],
    selfIndex: 0,
  });
  if (reminderEnabled) {
    await updateTontineGroup(db, group.id, { reminderEnabled: true });
  }
  return group;
}

describe('processTontineReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a reminder when enabled, due this month, and self has not paid', async () => {
    const { db } = createFakeDatabase();
    const group = await seedGroup(db, true);

    await processTontineReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
    const groups = await listTontineGroups(db);
    expect(groups.find((g) => g.id === group.id)?.lastRemindedMonth).toBe('2026-07');
  });

  it('does not send when the group has not opted in', async () => {
    const { db } = createFakeDatabase();
    await seedGroup(db, false);

    await processTontineReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send once self has already paid this round', async () => {
    const { db } = createFakeDatabase();
    await seedGroup(db, true);
    const payments = await listTontinePayments(db);
    const selfPayment = payments[0];
    await updateTontinePayment(db, selfPayment.id, { status: 'paid' });

    await processTontineReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send twice in the same month', async () => {
    const { db } = createFakeDatabase();
    await seedGroup(db, true);

    await processTontineReminders(db, NOON);
    await processTontineReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
  });

  it('is a no-op for a group with no self participant reminder needed outside the current round month', async () => {
    const { db } = createFakeDatabase();
    await seedGroup(db, true);

    await processTontineReminders(db, new Date('2027-06-15T12:00:00.000Z'));

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });
});
