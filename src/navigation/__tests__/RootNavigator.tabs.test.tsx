import { NavigationContainer } from '@react-navigation/native';
import { render, screen, within } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';
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
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ExpenseEntryProvider } from '../../screens';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { buildTheme } from '../../theme/buildTheme';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { RootNavigator } from '../RootNavigator';

async function renderShell({ countryCode = 'MA', senior = false } = {}) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light" initialSeniorMode={senior}>
          <EntitlementsProvider>
            <ExpenseEntryProvider>
              <NavigationContainer>
                <RootNavigator countryCode={countryCode} />
              </NavigationContainer>
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

/** Scoped to the bar: the tab screens underneath have buttons of their own (header, month picker). */
function bar() {
  return within(screen.getByTestId('tab-bar'));
}

/** The tab buttons, in render order — the FAB is addressed by its own label. */
function tabLabels(): string[] {
  return bar()
    .getAllByRole('button')
    .map((node) => node.props.accessibilityLabel as string)
    .filter((label) => label !== fr.nav.addTransaction);
}

describe('navigation bar (US-013)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('shows the four tabs and the central add button in a tontine market', async () => {
    await renderShell({ countryCode: 'MA' });

    expect(screen.getAllByText(fr.nav.home).length).toBeGreaterThan(0);
    expect(screen.getByText(fr.nav.categories)).toBeTruthy();
    expect(screen.getByText(fr.nav.tontine)).toBeTruthy();
    expect(screen.getByText(fr.nav.profile)).toBeTruthy();
    expect(bar().getByLabelText(fr.nav.addTransaction)).toBeTruthy();
  });

  it('replaces Tontine with Transferts in a market without one', async () => {
    await renderShell({ countryCode: 'FR' });

    expect(bar().getByText(fr.nav.transfers)).toBeTruthy();
    expect(screen.queryByText(fr.nav.tontine)).toBeNull();
    // The other three keep their place.
    expect(screen.getByText(fr.nav.categories)).toBeTruthy();
    expect(screen.getByText(fr.nav.profile)).toBeTruthy();
  });

  it('keeps the central add button in a diaspora market', async () => {
    await renderShell({ countryCode: 'FR' });
    expect(bar().getByLabelText(fr.nav.addTransaction)).toBeTruthy();
  });

  describe('senior mode', () => {
    it('simplifies the bar to Accueil and Profil', async () => {
      await renderShell({ senior: true });

      expect(screen.getAllByText(fr.nav.home).length).toBeGreaterThan(0);
      expect(screen.getByText(fr.nav.profile)).toBeTruthy();
      expect(screen.queryByText(fr.nav.categories)).toBeNull();
      expect(screen.queryByText(fr.nav.tontine)).toBeNull();
    });

    it('keeps the add button reachable', async () => {
      await renderShell({ senior: true });
      expect(bar().getByLabelText(fr.nav.addTransaction)).toBeTruthy();
    });
  });

  describe('touch targets', () => {
    function minHeightOf(label: string): unknown {
      const style = bar().getByLabelText(label).props.style;
      const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
      return (StyleSheet.flatten(resolved) as Record<string, unknown>).minHeight;
    }

    it('gives every tab at least 44pt', async () => {
      await renderShell();
      for (const label of tabLabels()) {
        expect(minHeightOf(label)).toBe(buildTheme('light', false).minTouchTarget);
      }
      expect(buildTheme('light', false).minTouchTarget).toBe(44);
    });

    it('grows the targets to 56pt in senior mode', async () => {
      await renderShell({ senior: true });
      for (const label of tabLabels()) {
        expect(minHeightOf(label)).toBe(buildTheme('light', true).minTouchTarget);
      }
      expect(buildTheme('light', true).minTouchTarget).toBe(56);
    });

    it('sizes the central add button to the same minimum', async () => {
      await renderShell();
      expect(minHeightOf(fr.nav.addTransaction)).toBe(buildTheme('light', false).minTouchTarget);
    });
  });

  // React Navigation reorders the tab row from `I18nManager.isRTL`; this proves the shell renders
  // the same set under both directions, standing in for the browser pass this sandbox can't run.
  it.each([
    ['LTR', false],
    ['RTL', true],
  ])('renders the whole bar in %s', async (_name, isRTL) => {
    I18nManager.isRTL = isRTL;
    await renderShell();

    expect(tabLabels()).toHaveLength(4);
    expect(bar().getByLabelText(fr.nav.addTransaction)).toBeTruthy();
  });
});
