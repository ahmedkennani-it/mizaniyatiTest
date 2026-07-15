import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

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

  it('throws when useSubscription is called outside a SubscriptionProvider', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Probe />)).rejects.toThrow(
      'useSubscription must be used within a SubscriptionProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
