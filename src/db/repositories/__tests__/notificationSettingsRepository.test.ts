import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { getNotificationSettings, setBudgetAlertsEnabled } from '../notificationSettingsRepository';

describe('notificationSettingsRepository', () => {
  it('defaults to opted out when no settings have been saved yet', async () => {
    const { db } = createFakeDatabase();
    expect(await getNotificationSettings(db)).toEqual({ budgetAlertsEnabled: false });
  });

  it('creates the settings row on first opt-in', async () => {
    const { db } = createFakeDatabase();

    const updated = await setBudgetAlertsEnabled(db, true);

    expect(updated).toEqual({ budgetAlertsEnabled: true });
    expect(await getNotificationSettings(db)).toEqual({ budgetAlertsEnabled: true });
  });

  it('updates the existing row in place on a second toggle', async () => {
    const { db } = createFakeDatabase();
    await setBudgetAlertsEnabled(db, true);

    const updated = await setBudgetAlertsEnabled(db, false);

    expect(updated).toEqual({ budgetAlertsEnabled: false });
    expect(await getNotificationSettings(db)).toEqual({ budgetAlertsEnabled: false });
  });
});
