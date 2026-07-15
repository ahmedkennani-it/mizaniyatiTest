import type { SqlDatabase } from '../types';
import type { NewSubscription, Subscription, SubscriptionStatus } from './types';

const SUBSCRIPTION_ID = 'default';

interface SubscriptionRow {
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  renews_at: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'plan_id, status, trial_ends_at, renews_at, created_at, updated_at';

function fromRow(row: SubscriptionRow): Subscription {
  return {
    planId: row.plan_id,
    status: row.status as SubscriptionStatus,
    trialEndsAt: row.trial_ends_at,
    renewsAt: row.renews_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `null` means the household has never subscribed — it's on the free plan. */
export async function getSubscription(db: SqlDatabase): Promise<Subscription | null> {
  const row = await db.getFirstAsync<SubscriptionRow>(
    `SELECT ${SELECT_COLUMNS} FROM subscriptions WHERE id = ?;`,
    [SUBSCRIPTION_ID],
  );
  return row ? fromRow(row) : null;
}

/** Inserts or overwrites the single subscription row (find-or-create by the fixed id). */
export async function upsertSubscription(
  db: SqlDatabase,
  input: NewSubscription,
): Promise<Subscription> {
  const now = new Date().toISOString();
  const existing = await getSubscription(db);
  const updated: Subscription = {
    planId: input.planId,
    status: input.status,
    trialEndsAt: input.trialEndsAt ?? null,
    renewsAt: input.renewsAt ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing) {
    await db.runAsync(
      'UPDATE subscriptions SET plan_id = ?, status = ?, trial_ends_at = ?, renews_at = ?, updated_at = ? WHERE id = ?;',
      [
        updated.planId,
        updated.status,
        updated.trialEndsAt,
        updated.renewsAt,
        updated.updatedAt,
        SUBSCRIPTION_ID,
      ],
    );
  } else {
    await db.runAsync(
      'INSERT INTO subscriptions (id, plan_id, status, trial_ends_at, renews_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        SUBSCRIPTION_ID,
        updated.planId,
        updated.status,
        updated.trialEndsAt,
        updated.renewsAt,
        updated.createdAt,
        updated.updatedAt,
      ],
    );
  }
  return updated;
}
