import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// The MVP registry only has Morocco as `selectable` — flipping France's flag here (only, the rest
// of the registry — including `isMenaGulfMarket`'s own internal data — stays real) lets these
// tests exercise a genuine "switch between two selectable markets" round trip, not just Morocco.
jest.mock('../../market', () => {
  const actual = jest.requireActual('../../market');
  return {
    ...actual,
    MARKETS: actual.MARKETS.map((market: { code: string; selectable: boolean }) =>
      market.code === 'FR' ? { ...market, selectable: true } : market,
    ),
  };
});

// eslint-disable-next-line import/first -- must come after jest.mock(...) calls above
import { createHousehold, getUserSettings, listHouseholds, saveLanguageCountry } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock(...) calls above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock(...) calls above
import { CountrySelectorScreen } from '../CountrySelectorScreen';

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <CountrySelectorScreen onBack={onBack} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('CountrySelectorScreen (US-057)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
  });

  it('highlights the currently selected country at the top, with a formatted example amount', async () => {
    renderScreen();

    expect(await screen.findByText('Pays actuel')).toBeTruthy();
    expect(await screen.findByText('Maroc')).toBeTruthy();
    expect((await screen.findAllByText(/1.234,56 MAD/)).length).toBeGreaterThan(0);
  });

  it('groups the rest of the registry into MENA & Golfe and Diaspora, with currency shown', async () => {
    renderScreen();

    expect(await screen.findByText('MENA & Golfe')).toBeTruthy();
    expect(await screen.findByText('Diaspora')).toBeTruthy();
    expect(await screen.findByText('Algérie')).toBeTruthy();
    expect(await screen.findByText('DZD')).toBeTruthy();
    expect(await screen.findByText('France')).toBeTruthy();
    expect(await screen.findByText('EUR')).toBeTruthy();
  });

  it('filters the list in real time by country name', async () => {
    renderScreen();
    await screen.findByText('Algérie');

    fireEvent.changeText(screen.getByLabelText('Rechercher'), 'France');

    expect(await screen.findByText('France')).toBeTruthy();
    expect(screen.queryByText('Algérie')).toBeNull();
  });

  it('filters the list in real time by currency code', async () => {
    renderScreen();
    await screen.findByText('France');

    fireEvent.changeText(screen.getByLabelText('Rechercher'), 'AED');

    expect(await screen.findByText('Émirats arabes unis')).toBeTruthy();
    expect(screen.queryByText('France')).toBeNull();
  });

  it('shows a "no results" message when nothing matches', async () => {
    renderScreen();
    await screen.findByText('France');

    fireEvent.changeText(screen.getByLabelText('Rechercher'), 'zzz-no-such-market');

    expect(await screen.findByText('Aucun pays ne correspond à votre recherche.')).toBeTruthy();
  });

  it('marks a non-selectable market as "Bientôt disponible" and leaves it inert', async () => {
    renderScreen();

    expect(await screen.findByText('Algérie')).toBeTruthy();
    expect((await screen.findAllByText('Bientôt disponible')).length).toBeGreaterThan(0);

    fireEvent.press(screen.getByText('Algérie'));

    // Nothing happens: still on the list, no confirmation screen opened.
    expect(await screen.findByText('Pays actuel')).toBeTruthy();
  });

  it('opens a confirmation explaining the currency change before applying it', async () => {
    renderScreen();

    fireEvent.press(await screen.findByText('France'));

    expect(await screen.findByText('Changer de devise ?')).toBeTruthy();
    expect(
      await screen.findByText(/reste dans sa devise d'origine \(MAD\).*EUR/),
    ).toBeTruthy();
  });

  it('cancelling the confirmation leaves the country unchanged', async () => {
    renderScreen();

    fireEvent.press(await screen.findByText('France'));
    await screen.findByText('Changer de devise ?');
    fireEvent.press(screen.getByText('Annuler'));

    expect(await screen.findByText('Pays actuel')).toBeTruthy();
    expect(await screen.findByText('Maroc')).toBeTruthy();
    const settings = await getUserSettings(mockFakeDb);
    expect(settings?.countryCode).toBe('MA');
  });

  it('confirming applies the new country, currency, and household currency', async () => {
    const onBack = jest.fn();
    renderScreen(onBack);

    fireEvent.press(await screen.findByText('France'));
    await screen.findByText('Changer de devise ?');
    fireEvent.press(screen.getByText('Confirmer'));

    expect(await screen.findByText('Pays actuel')).toBeTruthy();
    expect(await screen.findByText('France')).toBeTruthy();

    const settings = await getUserSettings(mockFakeDb);
    expect(settings?.countryCode).toBe('FR');
    expect(settings?.currencyCode).toBe('EUR');
    const households = await listHouseholds(mockFakeDb);
    expect(households[0].currencyCode).toBe('EUR');
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    renderScreen(onBack);

    fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
