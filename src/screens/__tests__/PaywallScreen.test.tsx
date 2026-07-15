import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { upsertSubscription } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { PaywallScreen } from '../PaywallScreen';

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <SubscriptionProvider>
        <PaywallScreen onBack={onBack} />
      </SubscriptionProvider>
    </ThemeProvider>,
  );
}

describe('PaywallScreen (US-029)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the free status and a trial offer with no subscription yet', async () => {
    await renderScreen();

    expect(await screen.findByText('Vous êtes sur le forfait Gratuit.')).toBeTruthy();
    expect(screen.getByText("Commencer l'essai gratuit de 14 jours")).toBeTruthy();
  });

  it('shows the Gratuit vs Pro comparison table', async () => {
    await renderScreen();

    await screen.findByText('Gratuit vs Pro');
    expect(screen.getByText('Tontine')).toBeTruthy();
    expect(screen.getAllByText('Illimité').length).toBeGreaterThan(0);
    expect(screen.getByText('10')).toBeTruthy(); // FREE_PLAN's categories.max
  });

  it('starts a trial and shows the trial-active status with an expiry date', async () => {
    await renderScreen();
    await screen.findByText('Vous êtes sur le forfait Gratuit.');

    await fireEvent.press(screen.getByText("Commencer l'essai gratuit de 14 jours"));

    expect(await screen.findByText(/Essai Pro actif/)).toBeTruthy();
    expect(screen.queryByText("Commencer l'essai gratuit de 14 jours")).toBeNull();
  });

  it('shows the trial-ended status and no second trial offer once it has expired', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    await renderScreen();

    expect(
      await screen.findByText(
        'Votre essai gratuit est terminé. Vous êtes revenu au forfait Gratuit.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Commencer l'essai gratuit de 14 jours")).toBeNull();
  });

  it('calls onBack when the back control is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    // Back is now the screen header's chevron button (accessibilityLabel "back").
    await fireEvent.press(screen.getByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
