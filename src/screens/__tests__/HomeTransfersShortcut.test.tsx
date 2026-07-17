import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;
const mockNavigate = jest.fn();

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { createHousehold, createMember, saveLanguageCountry } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { HomeScreen } from '../HomeScreen';

const TRANSFERS_PLAN: Plan = {
  id: 'home-transfers-shortcut-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'transfers', type: 'feature', booleanValue: true }],
};

/** A diaspora-market household (US-013's Transferts slot) — the market the shortcut targets. */
async function seedDiasporaHousehold() {
  await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
  await createMember(mockFakeDb, { name: 'Nadia' });
  await saveLanguageCountry(mockFakeDb, {
    languageCode: 'fr',
    countryCode: 'FR',
    currencyCode: 'EUR',
  });
}

/** A tontine-market household (Morocco) — no Transferts module, so no shortcut. */
async function seedTontineHousehold() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  await createMember(mockFakeDb, { name: 'Youssef' });
  await saveLanguageCountry(mockFakeDb, {
    languageCode: 'fr',
    countryCode: 'MA',
    currencyCode: 'MAD',
  });
}

async function renderHome(plan?: Plan) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={plan}>
            <ExpenseEntryProvider>
              <HomeScreen navigation={{ navigate: mockNavigate } as never} />
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('dashboard "Envoyer au {pays}" shortcut (US-047)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
    mockNavigate.mockClear();
  });

  it('shows the shortcut, naming the origin market, for an entitled diaspora household', async () => {
    await seedDiasporaHousehold();
    await renderHome(TRANSFERS_PLAN);

    expect(await screen.findByText('Envoyer au Maroc')).toBeTruthy();
  });

  it('opens the Transferts tab directly on the record form when tapped', async () => {
    await seedDiasporaHousehold();
    await renderHome(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Envoyer au Maroc'));

    expect(mockNavigate).toHaveBeenCalledWith('transfers', { openRecordForm: true });
  });

  it('hides the shortcut on the free plan', async () => {
    await seedDiasporaHousehold();
    await renderHome();

    expect(await screen.findByText(fr.home.balanceLabel)).toBeTruthy();
    expect(screen.queryByText('Envoyer au Maroc')).toBeNull();
  });

  it('hides the shortcut for a tontine-market household (no Transferts module)', async () => {
    await seedTontineHousehold();
    await renderHome(TRANSFERS_PLAN);

    expect(await screen.findByText(fr.home.balanceLabel)).toBeTruthy();
    expect(screen.queryByText(/^Envoyer au /)).toBeNull();
  });
});
