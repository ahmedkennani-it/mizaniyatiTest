import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { getSubscription, upsertSubscription } from '../subscriptionRepository';

describe('subscriptionRepository', () => {
  it('returns null when the household has never subscribed', async () => {
    const { db } = createFakeDatabase();
    expect(await getSubscription(db)).toBeNull();
  });

  it('creates the row on first upsert and reads it back', async () => {
    const { db } = createFakeDatabase();

    const subscription = await upsertSubscription(db, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: '2026-07-23T00:00:00.000Z',
    });

    expect(subscription.status).toBe('trial');
    expect(subscription.trialEndsAt).toBe('2026-07-23T00:00:00.000Z');
    expect(subscription.renewsAt).toBeNull();
    expect(await getSubscription(db)).toEqual(subscription);
  });

  it('overwrites the single row on a second upsert, preserving createdAt', async () => {
    const { db } = createFakeDatabase();
    const first = await upsertSubscription(db, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: '2026-07-23T00:00:00.000Z',
    });

    const second = await upsertSubscription(db, { planId: 'free', status: 'expired' });

    expect(second.status).toBe('expired');
    expect(second.planId).toBe('free');
    expect(second.createdAt).toBe(first.createdAt);
    expect(await getSubscription(db)).toEqual(second);
  });
});
