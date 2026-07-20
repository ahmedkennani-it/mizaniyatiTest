import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AppState, Pressable, Text } from 'react-native';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { upsertSubscription } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { FREE_PLAN, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider, useSubscription } from '../SubscriptionContext';

function Probe() {
  const { loading, plan, trialAlreadyUsed, startTrial } = useSubscription();
  return (
    <>
      <Text>{`loading:${loading}`}</Text>
      <Text>{`plan:${plan.id}`}</Text>
      <Text>{`trialAlreadyUsed:${trialAlreadyUsed}`}</Text>
      <Pressable onPress={() => startTrial()}>
        <Text>start-trial</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <SubscriptionProvider>
      <Probe />
    </SubscriptionProvider>,
  );
}

describe('SubscriptionProvider / useSubscription', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('defaults to the free plan with no subscription', async () => {
    await renderProbe();

    expect(await screen.findByText('loading:false')).toBeTruthy();
    expect(screen.getByText(`plan:${FREE_PLAN.id}`)).toBeTruthy();
    expect(screen.getByText('trialAlreadyUsed:false')).toBeTruthy();
  });

  it('resolves to the Pro plan once an active trial exists', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    await renderProbe();

    expect(await screen.findByText(`plan:${PRO_PLAN.id}`)).toBeTruthy();
    expect(screen.getByText('trialAlreadyUsed:true')).toBeTruthy();
  });

  it('starts a trial and switches to the Pro plan', async () => {
    await renderProbe();
    await screen.findByText(`plan:${FREE_PLAN.id}`);

    await fireEvent.press(screen.getByText('start-trial'));

    expect(await screen.findByText(`plan:${PRO_PLAN.id}`)).toBeTruthy();
    expect(screen.getByText('trialAlreadyUsed:true')).toBeTruthy();
  });

  it('falls back to the free plan once the trial has expired', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    await renderProbe();

    expect(await screen.findByText(`plan:${FREE_PLAN.id}`)).toBeTruthy();
    // The trial was already used even though it's now expired — no second trial is offered.
    expect(screen.getByText('trialAlreadyUsed:true')).toBeTruthy();
  });

  /** US-068's 3rd criterion: a trial that lapses while the app sits backgrounded (no interaction
   *  to trigger a re-render on its own) still drops Pro access "at the latest on resume". Uses a
   *  short *real* delay rather than fake timers — `waitFor`/`findBy*` poll on real timers, which
   *  fake timers would freeze. */
  it('re-resolves the plan when the app returns to the foreground', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 40).toISOString(),
    });

    await renderProbe();
    expect(await screen.findByText(`plan:${PRO_PLAN.id}`)).toBeTruthy();

    // Real time passes the trial's end with nothing to trigger a React re-render on its own — the
    // component would keep reading the stale `plan` from its last render forever without a nudge.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(screen.getByText(`plan:${PRO_PLAN.id}`)).toBeTruthy();

    // The mock accumulates calls across every test in this file (each mounts its own provider) —
    // the *last* 'change' registration is this test's own probe.
    const addEventListener = AppState.addEventListener as jest.Mock;
    const onChange = addEventListener.mock.calls
      .filter(([event]) => event === 'change')
      .at(-1)?.[1] as (state: string) => void;
    act(() => {
      onChange('active');
    });

    expect(await screen.findByText(`plan:${FREE_PLAN.id}`)).toBeTruthy();
  });

  it('throws when useSubscription is called outside a SubscriptionProvider', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      'useSubscription must be used within a SubscriptionProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
