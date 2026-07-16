import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

const mockOpenDatabaseSync = jest.fn(() => createFakeDatabase().db);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => mockOpenDatabaseSync(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { OnboardingFlow } from '../OnboardingFlow';

async function renderFlow() {
  const onComplete = jest.fn();
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <OnboardingFlow onComplete={onComplete} />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
  return { onComplete };
}

describe('OnboardingFlow (US-001)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('opens on the welcome screen', async () => {
    await renderFlow();
    expect(screen.getByText(fr.welcome.pitch)).toBeTruthy();
  });

  it('goes to the language & country step on "Commencer"', async () => {
    await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));

    expect(screen.getByText(fr.onboarding.languageLabel)).toBeTruthy();
    expect(screen.getByText(fr.onboarding.countryLabel)).toBeTruthy();
    expect(screen.queryByText(fr.welcome.pitch)).toBeNull();
  });

  it('goes to sign-in on "J’ai déjà un compte"', async () => {
    await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.signInLink));

    expect(screen.getByText(fr.signIn.title)).toBeTruthy();
    expect(screen.queryByText(fr.welcome.pitch)).toBeNull();
  });

  it('comes back to welcome from sign-in rather than dead-ending', async () => {
    await renderFlow();
    await fireEvent.press(screen.getByText(fr.welcome.signInLink));

    await fireEvent.press(screen.getByLabelText(fr.a11y.back));

    expect(screen.getByText(fr.welcome.pitch)).toBeTruthy();
  });

  /**
   * Signing in only means anything once there is an encrypted backup to restore (US-071a/b, phase
   * 17). Until then the screen says so, rather than showing credential fields that lead nowhere.
   */
  it('states plainly that sign-in has nothing to restore yet', async () => {
    await renderFlow();
    await fireEvent.press(screen.getByText(fr.welcome.signInLink));

    expect(screen.getByText(fr.signIn.unavailableMessage)).toBeTruthy();
  });
});
