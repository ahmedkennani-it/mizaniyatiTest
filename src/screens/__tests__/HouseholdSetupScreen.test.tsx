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
import { listHouseholds, listMembers } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { ColorScheme } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HouseholdSetupScreen } from '../HouseholdSetupScreen';

async function renderSetup(
  { onCreated = jest.fn(), currencyCode = 'MAD' } = {},
  { language = 'fr', scheme = 'light' as ColorScheme, senior = false } = {},
) {
  await i18n.changeLanguage(language);
  await render(
    <SafeAreaProvider>
      <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
        <HouseholdSetupScreen currencyCode={currencyCode} onCreated={onCreated} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { onCreated };
}

async function fillIn(firstName: string, householdName: string) {
  await fireEvent.changeText(screen.getByLabelText(fr.household.firstNameLabel), firstName);
  await fireEvent.changeText(screen.getByLabelText(fr.household.nameLabel), householdName);
}

describe('HouseholdSetupScreen (US-005)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('asks for the first name and the household name', async () => {
    await renderSetup();

    expect(screen.getByLabelText(fr.household.firstNameLabel)).toBeTruthy();
    expect(screen.getByLabelText(fr.household.nameLabel)).toBeTruthy();
  });

  it('creates the household and makes the creator an admin', async () => {
    const { onCreated } = await renderSetup();

    await fillIn('Youssef', 'Famille Benali');
    await fireEvent.press(screen.getByText(fr.household.submit));

    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(await listHouseholds(mockFakeDb)).toMatchObject([
      { name: 'Famille Benali', currencyCode: 'MAD' },
    ]);
    expect(await listMembers(mockFakeDb)).toMatchObject([{ name: 'Youssef', role: 'admin' }]);
  });

  it('gives the household the market currency it was handed', async () => {
    await renderSetup({ currencyCode: 'EUR' });

    await fillIn('Marie', 'Famille Dupont');
    await fireEvent.press(screen.getByText(fr.household.submit));

    expect((await listHouseholds(mockFakeDb))[0].currencyCode).toBe('EUR');
  });

  it('says the creator will be the admin', async () => {
    await renderSetup();
    expect(screen.getByText(fr.household.adminNote)).toBeTruthy();
  });

  describe('validation', () => {
    it('refuses an empty first name', async () => {
      const { onCreated } = await renderSetup();

      await fillIn('', 'Famille Benali');
      await fireEvent.press(screen.getByText(fr.household.submit));

      expect(screen.getByText(fr.household.errorFirstName)).toBeTruthy();
      expect(onCreated).not.toHaveBeenCalled();
      expect(await listHouseholds(mockFakeDb)).toHaveLength(0);
    });

    it('refuses an empty household name', async () => {
      const { onCreated } = await renderSetup();

      await fillIn('Youssef', '');
      await fireEvent.press(screen.getByText(fr.household.submit));

      expect(screen.getByText(fr.household.errorName)).toBeTruthy();
      expect(onCreated).not.toHaveBeenCalled();
    });

    // Whitespace is not a name; storing "   " would greet the user with a blank.
    it('refuses whitespace-only input', async () => {
      const { onCreated } = await renderSetup();

      await fillIn('   ', '   ');
      await fireEvent.press(screen.getByText(fr.household.submit));

      expect(onCreated).not.toHaveBeenCalled();
    });

    it('trims what it stores', async () => {
      await renderSetup();

      await fillIn('  Youssef  ', '  Famille Benali  ');
      await fireEvent.press(screen.getByText(fr.household.submit));

      expect((await listMembers(mockFakeDb))[0].name).toBe('Youssef');
      expect((await listHouseholds(mockFakeDb))[0].name).toBe('Famille Benali');
    });

    it('clears the error once the field is filled', async () => {
      await renderSetup();
      await fireEvent.press(screen.getByText(fr.household.submit));
      expect(screen.getByText(fr.household.errorFirstName)).toBeTruthy();

      await fireEvent.changeText(screen.getByLabelText(fr.household.firstNameLabel), 'Youssef');

      expect(screen.queryByText(fr.household.errorFirstName)).toBeNull();
    });
  });

  it('renders in Arabic', async () => {
    await renderSetup({}, { language: 'ar' });
    expect(screen.getByText(ar.household.title)).toBeTruthy();
    expect(screen.getByText(ar.household.submit)).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderSetup({}, { scheme, senior });
    expect(screen.getByText(fr.household.title)).toBeTruthy();
  });
});
