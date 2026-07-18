jest.mock('../../notifications', () => {
  const actual = jest.requireActual('../../notifications');
  return { ...actual, notificationClient: { presentNow: jest.fn() } };
});

// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createDebt, createDebtRepayment, listDebts } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { notificationClient } from '../../notifications';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { processDebtReminders } from '../processDebtReminders';

const NOON = new Date('2026-07-15T12:00:00.000Z');

function debtInput(dueDate: string | null) {
  return {
    label: 'Prêt',
    counterparty: 'Salma',
    direction: 'owed_to_household' as const,
    amountMinor: 30000,
    currencyCode: 'MAD',
    date: '2026-06-01',
    dueDate,
  };
}

describe('processDebtReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a reminder once the due date has arrived', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, debtInput('2026-07-15'));

    await processDebtReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
    const updated = (await listDebts(db)).find((d) => d.id === debt.id);
    expect(updated?.remindedAt).not.toBeNull();
  });

  it('does not send before the due date', async () => {
    const { db } = createFakeDatabase();
    await createDebt(db, debtInput('2026-08-01'));

    await processDebtReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send when no due date was agreed', async () => {
    const { db } = createFakeDatabase();
    await createDebt(db, debtInput(null));

    await processDebtReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send once the debt is fully repaid', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, debtInput('2026-07-15'));
    await createDebtRepayment(db, { debtId: debt.id, amountMinor: 30000, date: '2026-07-01' });

    await processDebtReminders(db, NOON);

    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send twice for the same debt', async () => {
    const { db } = createFakeDatabase();
    await createDebt(db, debtInput('2026-07-15'));

    await processDebtReminders(db, NOON);
    await processDebtReminders(db, NOON);

    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
  });
});
