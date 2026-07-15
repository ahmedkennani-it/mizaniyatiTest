import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { listTontinePayments } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createTontineGroupWithMembers } from '../../tontine';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { TontineScreen } from '../TontineScreen';

const TONTINE_PLAN: Plan = {
  id: 'tontine-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'tontine', type: 'feature', booleanValue: true }],
};

function renderScreen(plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <TontineScreen />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('TontineScreen (US-024)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the Pro upsell when the plan does not include tontine', async () => {
    await renderScreen();

    expect(await screen.findByText('La tontine fait partie du forfait Pro.')).toBeTruthy();
    expect(screen.queryByText('Créer une tontine')).toBeNull();
  });

  it('shows the disclaimer and creation CTA when entitled with no group yet', async () => {
    await renderScreen(TONTINE_PLAN);

    expect(
      await screen.findByText(/ne collecte, ne détient et ne transfère aucun argent/),
    ).toBeTruthy();
    expect(await screen.findByText('Créer une tontine')).toBeTruthy();
  });

  it('opens the group creation form', async () => {
    await renderScreen(TONTINE_PLAN);

    await fireEvent.press(await screen.findByText('Créer une tontine'));

    expect(await screen.findByText('Nouvelle tontine')).toBeTruthy();
  });

  it('shows the current round, my round, and calendar for an existing group', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);

    expect(await screen.findByText('Tontine famille')).toBeTruthy();
    expect(await screen.findByText('Tour 1 sur 2')).toBeTruthy();
    expect(await screen.findByText(/Bénéficiaire : Youssef/)).toBeTruthy();
    expect(await screen.findByText(/C'est ton tour ce mois-ci/)).toBeTruthy();
  });

  it('toggles a member payment status for the current round', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);
    await screen.findByText('Tontine famille');

    const markPaidButtons = await screen.findAllByText('Marquer payé');
    await fireEvent.press(markPaidButtons[0]);

    const payments = await listTontinePayments(mockFakeDb);
    expect(payments.filter((p) => p.status === 'paid')).toHaveLength(1);
    expect(await screen.findByText('1/2 payé')).toBeTruthy();
  });

  it('toggles the reminder opt-in', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);

    await fireEvent.press(await screen.findByText('Activer le rappel'));

    expect(await screen.findByText('Désactiver le rappel')).toBeTruthy();
  });
});
