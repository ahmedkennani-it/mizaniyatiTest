import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { getUserSettings, listCategories, listMembers } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { OnboardingLanguageCountryScreen } from '../OnboardingLanguageCountryScreen';

function renderScreen(onComplete: () => void) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <OnboardingLanguageCountryScreen onComplete={onComplete} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('OnboardingLanguageCountryScreen (US-023)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('persists the Maroc/MAD choice and seeds defaults on continue', async () => {
    const onComplete = jest.fn();
    await renderScreen(onComplete);

    expect(await screen.findByText('Bienvenue sur Mizaniyati')).toBeTruthy();
    expect(screen.getByText('Devise : MAD')).toBeTruthy();

    // The market is an explicit choice, never pre-selected (US-003).
    await fireEvent.press(screen.getByText('Maroc'));
    await fireEvent.press(screen.getByText('Continuer'));

    expect(onComplete).toHaveBeenCalled();
    const settings = await getUserSettings(mockFakeDb);
    expect(settings).toMatchObject({
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
      onboardingStep: 'language_country',
    });
    // `ensureAppReady` seeding default categories/member in the chosen language is the observable
    // effect of onboarding completing — no separate call is mocked/asserted.
    const categories = await listCategories(mockFakeDb);
    expect(categories.some((category) => category.name === 'Courses')).toBe(true);
    const members = await listMembers(mockFakeDb);
    expect(members.some((member) => member.name === 'Moi')).toBe(true);
  });

  it('persists the Arabic choice and seeds defaults in Arabic', async () => {
    const onComplete = jest.fn();
    await renderScreen(onComplete);

    await fireEvent.press(await screen.findByText('العربية'));
    await fireEvent.press(screen.getByText('المغرب'));
    await fireEvent.press(screen.getByText('متابعة'));

    expect(onComplete).toHaveBeenCalled();
    const settings = await getUserSettings(mockFakeDb);
    expect(settings?.languageCode).toBe('ar');
    const categories = await listCategories(mockFakeDb);
    expect(categories.length).toBeGreaterThan(0);
    const members = await listMembers(mockFakeDb);
    expect(members.some((member) => member.name === 'أنا')).toBe(true);
  });
});
