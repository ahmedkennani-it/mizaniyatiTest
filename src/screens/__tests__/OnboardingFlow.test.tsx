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
import { getDatabase } from '../../db/client';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { getUserSettings, listHouseholds } from '../../db/repositories';
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

  /**
   * Privacy comes after language & country on purpose: the commitments are worth reading in one's
   * own language, and that step is what creates the row the acceptance is timestamped onto.
   */
  it('reaches the privacy step after language & country, not before', async () => {
    await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));
    expect(screen.queryByText(fr.privacy.title)).toBeNull();

    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(screen.getByText(fr.onboarding.continueButton));

    expect(await screen.findByText(fr.privacy.title)).toBeTruthy();
  });

  it('records the acceptance and moves to the household step, not to the dashboard', async () => {
    const { onComplete } = await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));
    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(screen.getByText(fr.onboarding.continueButton));
    await screen.findByText(fr.privacy.title);

    // The language & country step alone must not let the household through.
    expect(onComplete).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText(fr.privacy.acceptButton));

    expect((await getUserSettings(getDatabase()))?.privacyAcceptedAt).toEqual(expect.any(String));
    expect(await screen.findByText(fr.household.title)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('completes only once the household is named (US-005)', async () => {
    const { onComplete } = await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));
    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(screen.getByText(fr.onboarding.continueButton));
    await fireEvent.press(await screen.findByText(fr.privacy.acceptButton));
    await screen.findByText(fr.household.title);

    await fireEvent.changeText(screen.getByLabelText(fr.household.firstNameLabel), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText(fr.household.nameLabel), 'Famille Benali');
    await fireEvent.press(screen.getByText(fr.household.submit));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await listHouseholds(getDatabase())).toMatchObject([{ name: 'Famille Benali' }]);
  });

  it('opens the full policy from the privacy step and comes back', async () => {
    await renderFlow();

    await fireEvent.press(screen.getByText(fr.welcome.startButton));
    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(screen.getByText(fr.onboarding.continueButton));
    await screen.findByText(fr.privacy.title);

    await fireEvent.press(screen.getByText(fr.privacy.policyLink));
    expect(screen.getByText(fr.privacyPolicy.intro)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(fr.a11y.back));
    expect(screen.getByText(fr.privacy.title)).toBeTruthy();
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
