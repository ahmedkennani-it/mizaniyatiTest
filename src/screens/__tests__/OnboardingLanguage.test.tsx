import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';
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
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
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

describe('onboarding language step (US-002)', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    I18nManager.isRTL = originalIsRTL;
    await i18n.changeLanguage('fr');
  });

  it('offers the three v1 languages, each with its native and translated name', async () => {
    await renderStep();

    // Native names, as a speaker would look for them. "Français" appears twice in a French UI —
    // it is its own translation — so the row is matched by its distinct Arabic/English siblings.
    expect(screen.getAllByText(fr.language.nativeFrench).length).toBeGreaterThan(0);
    expect(screen.getByText(fr.language.nativeArabic)).toBeTruthy();
    expect(screen.getByText(fr.language.nativeEnglish)).toBeTruthy();
    // And the same three named in the active language.
    expect(screen.getByText(fr.language.arabic)).toBeTruthy();
    expect(screen.getByText(fr.language.english)).toBeTruthy();
  });

  // English shipped a full catalog but the picker only ever listed fr and ar.
  it('does not drop English from the list', async () => {
    await renderStep();
    await fireEvent.press(screen.getByText(fr.language.nativeEnglish));

    expect(i18n.language).toBe('en');
  });

  it('names the coming packs without making them selectable', async () => {
    await renderStep();

    const mention = screen.getByText(fr.language.additionalPacks);
    expect(mention).toBeTruthy();
    // A `Txt`, not a control: nothing to press.
    expect(mention.props.onPress).toBeUndefined();
  });

  it('flips the interface to RTL as soon as Arabic is picked', async () => {
    await renderStep();

    await fireEvent.press(screen.getByText(fr.language.nativeArabic));

    expect(i18n.language).toBe('ar');
    expect(I18nManager.forceRTL).toHaveBeenLastCalledWith(true);
    // The screen's own copy switches with it, rather than waiting for "Continuer".
    expect(screen.getByText(ar.onboarding.countryLabel)).toBeTruthy();
  });

  it('flips back to LTR when a latin language is picked again', async () => {
    await renderStep();
    await fireEvent.press(screen.getByText(fr.language.nativeArabic));

    await fireEvent.press(screen.getByText(ar.language.nativeFrench));

    expect(I18nManager.forceRTL).toHaveBeenLastCalledWith(false);
  });

  /**
   * The business rule: the picker opens on the phone's own language. Nothing in the screen does
   * this — `i18n` detects the device locale at import, `LanguageProvider` starts from it. The
   * suite pins that locale to fr-MA (`jest/setupTests.js`), so French is what a fresh render shows.
   */
  it('pre-selects the language detected from the system locale', async () => {
    await renderStep();
    expect(i18n.language).toBe('fr');
  });

  it('persists the chosen language, so the next launch reloads it', async () => {
    const { onComplete } = await renderStep();

    await fireEvent.press(screen.getByText(fr.language.nativeArabic));
    await fireEvent.press(screen.getByText(ar.onboarding.continueButton));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await getUserSettings(mockFakeDb)).toMatchObject({ languageCode: 'ar' });
  });

  it('persists English too', async () => {
    await renderStep();

    await fireEvent.press(screen.getByText(fr.language.nativeEnglish));
    await fireEvent.press(screen.getByText('Continue'));

    expect(await getUserSettings(mockFakeDb)).toMatchObject({ languageCode: 'en' });
  });
});
