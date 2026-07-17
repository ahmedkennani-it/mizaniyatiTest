import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { EntitlementsProvider, useEntitlements } from '../EntitlementsContext';
import { FREE_PLAN } from '../freePlan';
import type { Plan } from '../types';

function Probe() {
  const { plan, can, limit } = useEntitlements();

  return (
    <>
      <Text>{`plan:${plan.id}`}</Text>
      <Text>{`voice:${can('voice')}`}</Text>
      <Text>{`tontine:${can('tontine')}`}</Text>
      <Text>{`categories.max:${limit('categories.max')}`}</Text>
    </>
  );
}

describe('EntitlementsProvider / useEntitlements', () => {
  it('defaults to FREE_PLAN when no plan prop is given', async () => {
    await render(
      <EntitlementsProvider>
        <Probe />
      </EntitlementsProvider>,
    );

    expect(screen.getByText('plan:free')).toBeTruthy();
    expect(screen.getByText('voice:false')).toBeTruthy();
    expect(screen.getByText('tontine:false')).toBeTruthy();
    expect(
      screen.getByText(
        `categories.max:${FREE_PLAN.entitlements.find((e) => e.key === 'categories.max')?.numericValue}`,
      ),
    ).toBeTruthy();
  });

  it('reads entitlements from a custom plan (e.g. Pro) instead of a hardcoded value', async () => {
    const proPlan: Plan = {
      id: 'pro',
      name: 'Pro',
      isDefaultFree: false,
      entitlements: [
        { key: 'voice', type: 'feature', booleanValue: true },
        { key: 'tontine', type: 'feature', booleanValue: true },
        { key: 'categories.max', type: 'limit', numericValue: 999 },
      ],
    };

    await render(
      <EntitlementsProvider plan={proPlan}>
        <Probe />
      </EntitlementsProvider>,
    );

    expect(screen.getByText('plan:pro')).toBeTruthy();
    expect(screen.getByText('tontine:true')).toBeTruthy();
    expect(screen.getByText('categories.max:999')).toBeTruthy();
  });

  it('throws when useEntitlements is called outside an EntitlementsProvider', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      'useEntitlements must be used within an EntitlementsProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
