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
