import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { getNotificationSettings, setBudgetAlertsEnabled } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ProfileScreen } from '../ProfileScreen';

function renderScreen() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <ProfileScreen />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

/** Entry points to Pro-gated spec screens (e.g. Debts) need `useEntitlements()` in scope. */
function renderScreenAsPro() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={PRO_PLAN}>
          <ProfileScreen />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ProfileScreen — alertes de plafond (US-019)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the opt-in button when notifications are off by default', async () => {
    await renderScreen();

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
  });

  it('opts in on press and persists the setting', async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByText('Activer les alertes'));

    expect(await screen.findByText('Désactiver les alertes')).toBeTruthy();
    expect(await getNotificationSettings(mockFakeDb)).toEqual({ budgetAlertsEnabled: true });
  });

  it('reflects an already-enabled setting on mount', async () => {
    await setBudgetAlertsEnabled(mockFakeDb, true);

    await renderScreen();

    expect(await screen.findByText('Désactiver les alertes')).toBeTruthy();
  });

  it('opts back out on a second press', async () => {
    await setBudgetAlertsEnabled(mockFakeDb, true);
    await renderScreen();

    await fireEvent.press(await screen.findByText('Désactiver les alertes'));

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
    expect(await getNotificationSettings(mockFakeDb)).toEqual({ budgetAlertsEnabled: false });
  });
});

describe('ProfileScreen — accès aux Dettes & prêts (US-048)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('opens the Debts screen from the "Famille & fonctionnalités" section', async () => {
    renderScreenAsPro();

    await fireEvent.press(await screen.findByText('Dettes & prêts'));

    expect(await screen.findByText('On me doit')).toBeTruthy();
  });

  it('returns to the settings list from the Debts screen', async () => {
    renderScreenAsPro();

    await fireEvent.press(await screen.findByText('Dettes & prêts'));
    await screen.findByText('On me doit');
    fireEvent.press(await screen.findByLabelText('Retour'));

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
  });
});
