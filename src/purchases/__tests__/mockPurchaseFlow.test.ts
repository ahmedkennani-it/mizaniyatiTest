import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { getSubscription, upsertSubscription } from '../../db/repositories';
import {
  PurchaseCancelledError,
  PurchaseNetworkError,
  cancelSubscription,
  purchasePro,
  restorePurchases,
} from '../mockPurchaseFlow';

describe('purchasePro (US-066a)', () => {
  it('unlocks Pro and persists the purchase locally', async () => {
    const { db } = createFakeDatabase();

    const subscription = await purchasePro(db, 'monthly');

    expect(subscription.status).toBe('active');
    expect(subscription.planId).toBe('pro');
    expect(subscription.productId).toBe('monthly');
    expect(await getSubscription(db)).toEqual(subscription);
  });

  it('sets the renewal date roughly a month out for the monthly product', async () => {
    const { db } = createFakeDatabase();
    const before = Date.now();

    const subscription = await purchasePro(db, 'monthly');

    const renewsAt = new Date(subscription.renewsAt as string).getTime();
    expect(renewsAt).toBeGreaterThan(before + 29 * 24 * 60 * 60 * 1000);
    expect(renewsAt).toBeLessThan(before + 31 * 24 * 60 * 60 * 1000);
  });

  it('sets the renewal date roughly a year out for the annual product', async () => {
    const { db } = createFakeDatabase();
    const before = Date.now();

    const subscription = await purchasePro(db, 'annual');

    const renewsAt = new Date(subscription.renewsAt as string).getTime();
    expect(renewsAt).toBeGreaterThan(before + 364 * 24 * 60 * 60 * 1000);
    expect(renewsAt).toBeLessThan(before + 366 * 24 * 60 * 60 * 1000);
  });

  it('overwrites a prior trial with the real purchase, clearing the trial date', async () => {
    const { db } = createFakeDatabase();
    await upsertSubscription(db, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const subscription = await purchasePro(db, 'annual');

    expect(subscription.status).toBe('active');
    expect(subscription.trialEndsAt).toBeNull();
  });

  /**
   * A real store call can fail this way (the household backs out of the OS purchase sheet, or the
   * device is offline) — the mock lets a caller force each path so the UI's handling of them can
   * be tested without one actually existing to fail against.
   */
  it('rejects with a typed error on a simulated cancellation, without touching the subscription', async () => {
    const { db } = createFakeDatabase();

    await expect(purchasePro(db, 'monthly', 'cancelled')).rejects.toThrow(PurchaseCancelledError);
    expect(await getSubscription(db)).toBeNull();
  });

  it('rejects with a typed error on a simulated network failure, without touching the subscription', async () => {
    const { db } = createFakeDatabase();

    await expect(purchasePro(db, 'monthly', 'network_error')).rejects.toThrow(PurchaseNetworkError);
    expect(await getSubscription(db)).toBeNull();
  });
});

describe('restorePurchases (US-066a)', () => {
  it('reports nothing to restore when the household never purchased anything', async () => {
    const { db } = createFakeDatabase();

    const result = await restorePurchases(db);

    expect(result).toEqual({ restored: false, subscription: null });
  });

  it('restores a still-valid Pro purchase', async () => {
    const { db } = createFakeDatabase();
    await purchasePro(db, 'annual');

    const result = await restorePurchases(db);

    expect(result.restored).toBe(true);
    expect(result.subscription?.productId).toBe('annual');
  });

  it('does not report a lapsed purchase as restored', async () => {
    const { db } = createFakeDatabase();
    await upsertSubscription(db, {
      planId: 'pro',
      status: 'expired',
      productId: 'monthly',
    });

    const result = await restorePurchases(db);

    expect(result.restored).toBe(false);
  });

  it('does not report an expired trial as restored', async () => {
    const { db } = createFakeDatabase();
    await upsertSubscription(db, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    const result = await restorePurchases(db);

    expect(result.restored).toBe(false);
  });
});

describe('cancelSubscription (US-069)', () => {
  it('turns off auto-renew but keeps the same renewal date', async () => {
    const { db } = createFakeDatabase();
    const purchased = await purchasePro(db, 'monthly');

    const cancelled = await cancelSubscription(db);

    expect(cancelled?.status).toBe('cancelled');
    expect(cancelled?.renewsAt).toBe(purchased.renewsAt);
    expect(cancelled?.productId).toBe('monthly');
  });

  it('persists the cancellation', async () => {
    const { db } = createFakeDatabase();
    await purchasePro(db, 'annual');

    await cancelSubscription(db);

    expect((await getSubscription(db))?.status).toBe('cancelled');
  });

  it('is a no-op when there is nothing active to cancel', async () => {
    const { db } = createFakeDatabase();

    const result = await cancelSubscription(db);

    expect(result).toBeNull();
    expect(await getSubscription(db)).toBeNull();
  });

  it('does not touch a trial (only a real purchase can be cancelled)', async () => {
    const { db } = createFakeDatabase();
    await upsertSubscription(db, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const result = await cancelSubscription(db);

    expect(result?.status).toBe('trial');
  });
});
