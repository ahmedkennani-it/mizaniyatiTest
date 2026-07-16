import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

const mockOpenDatabaseSync = jest.fn(() => createFakeDatabase().db);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => mockOpenDatabaseSync(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ExpenseEntryProvider } from '../../screens';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { RootNavigator } from '../RootNavigator';

async function renderShellIn(language: 'fr' | 'ar') {
  await i18n.changeLanguage(language);
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

/**
 * Guards the "no hard-coded visible string" rule for the navigation shell (US-061a): every label the
 * tab bar shows — the four tab names and the central FAB's accessibility label — must come from the
 * active catalog. A literal baked into `RootNavigator`/`FloatingTabBar` would survive the language
 * switch and show up in the Arabic render, which is exactly what the second case rejects.
 */
describe('navigation shell strings come from the catalogs', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('labels every tab and the FAB from the French catalog', async () => {
    await renderShellIn('fr');

    expect(screen.getAllByText(fr.nav.home).length).toBeGreaterThan(0);
    expect(screen.getByText(fr.nav.categories)).toBeTruthy();
    expect(screen.getByText(fr.nav.tontine)).toBeTruthy();
    expect(screen.getByText(fr.nav.profile)).toBeTruthy();
    expect(screen.getByLabelText(fr.nav.addTransaction)).toBeTruthy();
  });

  it('leaves no French or literal string behind once switched to Arabic', async () => {
    await renderShellIn('ar');

    expect(screen.getAllByText(ar.nav.home).length).toBeGreaterThan(0);
    expect(screen.getByText(ar.nav.categories)).toBeTruthy();
    expect(screen.getByText(ar.nav.profile)).toBeTruthy();
    expect(screen.getByLabelText(ar.nav.addTransaction)).toBeTruthy();

    expect(screen.queryByText(fr.nav.home)).toBeNull();
    expect(screen.queryByText(fr.nav.categories)).toBeNull();
    expect(screen.queryByText(fr.nav.profile)).toBeNull();
    // The pre-i18n placeholder the FAB used to carry, and the raw route names the tab bar falls
    // back to when an `options.tabBarLabel` is missing.
    expect(screen.queryByLabelText('add-transaction')).toBeNull();
    expect(screen.queryByText('home')).toBeNull();
    expect(screen.queryByText('profile')).toBeNull();
  });
});
