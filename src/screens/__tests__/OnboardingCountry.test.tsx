import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { getUserSettings } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { marketModules } from '../../market';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { OnboardingLanguageCountryScreen } from '../OnboardingLanguageCountryScreen';

async function renderStep() {
  const onComplete = jest.fn();
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <OnboardingLanguageCountryScreen onComplete={onComplete} />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
  return { onComplete };
}

function continueButton() {
  return screen.getByRole('button', { name: fr.onboarding.continueButton });
}

describe('onboarding country step (US-003)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('confirms the currency under the country', async () => {
    await renderStep();

    expect(screen.getByText(fr.onboarding.countryMorocco)).toBeTruthy();
    expect(screen.getByText('Devise : MAD')).toBeTruthy();
  });

  it('names the markets on the way, with their currencies', async () => {
    await renderStep();

    const mention = screen.getByText(/Bientôt/);
    for (const currency of ['DZD', 'TND', 'EGP', 'EUR', 'AED', 'SAR']) {
      expect(mention.props.children).toContain(currency);
    }
  });

  it('does not offer the announced markets as a choice', async () => {
    await renderStep();

    expect(screen.queryByText(fr.onboarding.countryFrance)).toBeNull();
    expect(screen.queryByText(fr.onboarding.countryUae)).toBeNull();
  });

  /**
   * The country decides the currency and the local modules, so it has to be an explicit choice —
   * pre-selecting the only market on offer would make it silently assumed.
   */
  describe('"Continuer" needs a choice', () => {
    it('is disabled before a country is picked', async () => {
      await renderStep();
      expect(continueButton()).toBeDisabled();
    });

    it('saves nothing when pressed without a choice', async () => {
      const { onComplete } = await renderStep();

      await fireEvent.press(continueButton());

      expect(onComplete).not.toHaveBeenCalled();
      expect(await getUserSettings(mockFakeDb)).toBeNull();
    });

    it('is enabled once a country is picked', async () => {
      await renderStep();

      await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));

      expect(continueButton()).toBeEnabled();
    });
  });

  it('stores the market and its currency', async () => {
    const { onComplete } = await renderStep();

    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(continueButton());

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await getUserSettings(mockFakeDb)).toMatchObject({
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
  });

  it('configures the local modules from the stored market', async () => {
    await renderStep();

    await fireEvent.press(screen.getByText(fr.onboarding.countryMorocco));
    await fireEvent.press(continueButton());

    const settings = await getUserSettings(mockFakeDb);
    // The stored country is what every module decision reads from afterwards (the tab bar, US-013).
    expect(marketModules(settings!.countryCode)).toEqual(['tontine']);
  });
});
