import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WelcomeScreen } from '../WelcomeScreen';
import i18n from '../../i18n/i18n';
import { ar } from '../../i18n/locales/ar';
import { en } from '../../i18n/locales/en';
import { fr } from '../../i18n/locales/fr';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';

async function renderWelcome(
  { onStart = jest.fn(), onSignIn = jest.fn() } = {},
  { language = 'fr', scheme = 'light' as ColorScheme, senior = false } = {},
) {
  await i18n.changeLanguage(language);
  await render(
    <SafeAreaProvider>
      <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
        <WelcomeScreen onStart={onStart} onSignIn={onSignIn} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { onStart, onSignIn };
}

describe('WelcomeScreen (US-001)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('shows the mark, the app name and the pitch', async () => {
    await renderWelcome();

    expect(screen.getByTestId('welcome-logo', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText(fr.welcome.appName)).toBeTruthy();
    expect(screen.getByText('Le budget de la famille, clair et privé')).toBeTruthy();
  });

  /**
   * The badge is the product's whole premise for someone deciding whether to trust it with the
   * family's money, so it must be on the first screenful. The screen is deliberately not a
   * `ScrollView`: nothing here can be pushed below the fold.
   */
  it('shows the no-bank badge without scrolling', async () => {
    await renderWelcome();

    expect(screen.getByText(fr.welcome.noBankBadge)).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
  });

  it('starts onboarding on "Commencer"', async () => {
    const { onStart, onSignIn } = await renderWelcome();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('opens sign-in on "J’ai déjà un compte"', async () => {
    const { onStart, onSignIn } = await renderWelcome();

    await fireEvent.press(screen.getByText(fr.welcome.signInLink));
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)('renders in %s', async (language, catalog) => {
    await renderWelcome({}, { language });

    expect(screen.getByText(catalog.welcome.pitch)).toBeTruthy();
    expect(screen.getByText(catalog.welcome.noBankBadge)).toBeTruthy();
    expect(screen.getByText(catalog.welcome.startButton)).toBeTruthy();
    expect(screen.getByText(catalog.welcome.signInLink)).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderWelcome({}, { scheme, senior });
    expect(screen.getByText(fr.welcome.appName)).toBeTruthy();
  });

  // The mark is a decorative tile with a letter in it, not information.
  it('keeps the logo out of the screen reader’s way', async () => {
    await renderWelcome();
    expect(screen.queryByTestId('welcome-logo')).toBeNull();
  });
});
