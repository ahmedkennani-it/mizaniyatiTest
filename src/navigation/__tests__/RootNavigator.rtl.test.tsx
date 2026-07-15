import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

const mockOpenDatabaseSync = jest.fn((_databaseName: string) => createFakeDatabase().db);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (databaseName: string) => mockOpenDatabaseSync(databaseName),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { RootNavigator } from '../RootNavigator';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ExpenseEntryProvider } from '../../screens';

// React Navigation's bottom tab bar mirrors itself for RTL from `I18nManager.isRTL` (set by
// `LanguageProvider`, US-003) with no manual handling on our side — this just proves the shell
// renders all four tabs without crashing under both directions, standing in for the device/browser
// RTL+LTR pass this sandbox can't run (see `apps/mobile/CLAUDE.md`). `ExpenseEntryProvider` wraps
// the navigator (as it does in `App.tsx`) since `HomeScreen` now reads `useExpenseEntry()`.
async function renderNavigator() {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider>
            <ExpenseEntryProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('RootNavigator under RTL and LTR', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders all four tabs in LTR (French)', async () => {
    I18nManager.isRTL = false;
    await renderNavigator();

    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
    expect(screen.getByText('Catégories')).toBeTruthy();
    expect(screen.getByText('Tontine')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();
  });

  it('renders all four tabs in RTL (Arabic)', async () => {
    I18nManager.isRTL = true;
    await renderNavigator();

    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
    expect(screen.getByText('Catégories')).toBeTruthy();
    expect(screen.getByText('Tontine')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();
  });
});
