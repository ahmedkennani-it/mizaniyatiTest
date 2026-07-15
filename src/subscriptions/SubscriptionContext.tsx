import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getDatabase } from '../db/client';
import { getSubscription, upsertSubscription } from '../db/repositories';
import type { Subscription } from '../db/repositories';
import type { Plan } from '../entitlements';
import { FREE_PLAN } from '../entitlements';
import { resolveActivePlan } from './resolveActivePlan';

const TRIAL_DURATION_DAYS = 14;

export interface SubscriptionContextValue {
  /** `true` until the subscription row has been read once at startup. */
  loading: boolean;
  /** `null` means the household has never subscribed (still on the free plan). */
  subscription: Subscription | null;
  /** The `Plan` the rest of the app should read entitlements from right now. */
  plan: Plan;
  /** A subscription row already exists — the one free trial has already been used/is in use. */
  trialAlreadyUsed: boolean;
  startTrial: () => Promise<void>;
  /** Re-reads the subscription from storage — call after `startTrial` or a future real purchase. */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  // `undefined` = not read from storage yet, distinct from `null` (read, no subscription row).
  // Lets `refresh` stay a plain tear-off (`.then(setSubscription)`) instead of an inline arrow
  // that calls a setter — see `AddExpenseForm`'s `onSaved` note in `apps/mobile/CLAUDE.md` for why
  // that shape avoids the `react-hooks/set-state-in-effect` lint rule.
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);

  const refresh = useCallback(() => {
    return getSubscription(getDatabase()).then(setSubscription);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startTrial = useCallback(async () => {
    const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await upsertSubscription(getDatabase(), { planId: 'pro', status: 'trial', trialEndsAt });
    await refresh();
  }, [refresh]);

  const loading = subscription === undefined;
  const resolvedSubscription = subscription ?? null;

  const value: SubscriptionContextValue = {
    loading,
    subscription: resolvedSubscription,
    plan: loading ? FREE_PLAN : resolveActivePlan(resolvedSubscription),
    trialAlreadyUsed: resolvedSubscription !== null,
    startTrial,
    refresh,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
