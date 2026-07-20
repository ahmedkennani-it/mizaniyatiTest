import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createHousehold, getUserSettings, saveLanguageCountry } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { activateRamadanTheme, ramadanRangeNear } from '../../seasonalThemes';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

const RAMADAN_PLAN: Plan = {
  id: 'ramadan-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'ramadan', type: 'feature', booleanValue: true }],
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function renderHome(plan?: Plan) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={plan}>
            <SubscriptionProvider>
              <ExpenseEntryProvider>
                <HomeScreen />
              </ExpenseEntryProvider>
            </SubscriptionProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('HomeScreen — Ramadan dashboard identity (US-041)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the regular dashboard when no Ramadan theme is active, even on the Pro plan', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    await renderHome(RAMADAN_PLAN);

    expect(await screen.findByText('Solde du mois — restant')).toBeTruthy();
    expect(screen.queryByText('Mode Ramadan')).toBeNull();
  });

  it('switches the dashboard identity when a Ramadan theme is active and entitled', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    await activateRamadanTheme(mockFakeDb, {
      startDate: isoDate(yesterday),
      endDate: isoDate(tomorrow),
      envelopeMinor: 500000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    await renderHome(RAMADAN_PLAN);

    expect(await screen.findByText('Mode Ramadan')).toBeTruthy();
    expect(screen.getByText('Budget Ramadan — restant')).toBeTruthy();
    // The remaining amount and the envelope footer stat both read 5.000,00 (nothing spent yet).
    const hero = screen.getByTestId('balance-hero');
    expect(within(hero).getAllByText(/5\.000,00/).length).toBeGreaterThan(0);
    expect(within(hero).getByText('Jours restants')).toBeTruthy();
    // The four Ramadan sub-category tiles.
    expect(screen.getByText('Iftar & Suhoor')).toBeTruthy();
    expect(screen.getByText('Zakat al-Fitr')).toBeTruthy();
    expect(screen.getByText('Aïd & cadeaux')).toBeTruthy();
    expect(screen.getByText('Invités & famille')).toBeTruthy();
    // The regular month-scoped dashboard sections are gone.
    expect(screen.queryByText('Solde du mois — restant')).toBeNull();
    expect(screen.queryByText('Dernières opérations')).toBeNull();
  });

  /** `RAMADAN_PLAN` entitles ramadan but not zakat — the shortcut still opens Zakat, which (US-068)
   *  redirects a locked, assessment-less household straight to the paywall. */
  it('opens Zakat from the dashboard\'s rate-labeled shortcut', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    const now = new Date();
    await activateRamadanTheme(mockFakeDb, {
      startDate: isoDate(now),
      endDate: isoDate(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
      envelopeMinor: 500000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    await renderHome(RAMADAN_PLAN);

    await fireEvent.press(await screen.findByText('Calculer ma Zakat (taux 2,5 %)'));

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
  });

  it('offers to revert to the standard theme once Ramadan has ended', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    const now = new Date();
    const longAgoStart = new Date(now);
    longAgoStart.setUTCDate(longAgoStart.getUTCDate() - 40);
    const longAgoEnd = new Date(now);
    longAgoEnd.setUTCDate(longAgoEnd.getUTCDate() - 10);
    await activateRamadanTheme(mockFakeDb, {
      startDate: isoDate(longAgoStart),
      endDate: isoDate(longAgoEnd),
      envelopeMinor: 500000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    await renderHome(RAMADAN_PLAN);

    expect(await screen.findByText('Récapitulatif du Ramadan')).toBeTruthy();
    await fireEvent.press(screen.getByText('Revenir au thème standard'));

    expect(await screen.findByText('Solde du mois — restant')).toBeTruthy();
  });

  it('never switches identity on the free plan, even with an active theme row', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    const now = new Date();
    await activateRamadanTheme(mockFakeDb, {
      startDate: isoDate(now),
      endDate: isoDate(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
      envelopeMinor: 500000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    await renderHome();

    expect(await screen.findByText('Solde du mois — restant')).toBeTruthy();
    expect(screen.queryByText('Mode Ramadan')).toBeNull();
  });
});

describe('HomeScreen — Ramadan activation suggestion (US-041)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('suggests activating Ramadan mode within the week before its approximate start', async () => {
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
    const { start } = ramadanRangeNear(new Date());
    const threeDaysBefore = new Date(start);
    threeDaysBefore.setUTCDate(threeDaysBefore.getUTCDate() - 3);
    jest.useFakeTimers().setSystemTime(threeDaysBefore);

    await renderHome(RAMADAN_PLAN);

    expect(await screen.findByText('Le Ramadan approche')).toBeTruthy();
    jest.useRealTimers();
  });

  it('opens the Ramadan setup screen from the suggestion', async () => {
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
    const { start } = ramadanRangeNear(new Date());
    const threeDaysBefore = new Date(start);
    threeDaysBefore.setUTCDate(threeDaysBefore.getUTCDate() - 3);
    jest.useFakeTimers().setSystemTime(threeDaysBefore);

    await renderHome(RAMADAN_PLAN);
    await fireEvent.press(await screen.findByText('Activer'));

    expect(await screen.findByText('Configurer le mode Ramadan')).toBeTruthy();
    jest.useRealTimers();
  });

  it('dismisses the suggestion and remembers the dismissal', async () => {
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
    const { start } = ramadanRangeNear(new Date());
    const threeDaysBefore = new Date(start);
    threeDaysBefore.setUTCDate(threeDaysBefore.getUTCDate() - 3);
    jest.useFakeTimers().setSystemTime(threeDaysBefore);

    await renderHome(RAMADAN_PLAN);
    await fireEvent.press(await screen.findByText('Pas maintenant'));

    await waitFor(() => {
      expect(screen.queryByText('Le Ramadan approche')).toBeNull();
    });
    expect((await getUserSettings(mockFakeDb))?.ramadanSuggestionDismissedHijriYear).not.toBeNull();
    jest.useRealTimers();
  });

  it('does not suggest activation on the free plan', async () => {
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
    const { start } = ramadanRangeNear(new Date());
    const threeDaysBefore = new Date(start);
    threeDaysBefore.setUTCDate(threeDaysBefore.getUTCDate() - 3);
    jest.useFakeTimers().setSystemTime(threeDaysBefore);

    await renderHome();

    await screen.findByText('Solde du mois — restant');
    expect(screen.queryByText('Le Ramadan approche')).toBeNull();
    jest.useRealTimers();
  });

  it('does not suggest activation far outside the window', async () => {
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
    const { start } = ramadanRangeNear(new Date());
    const farBefore = new Date(start);
    farBefore.setUTCDate(farBefore.getUTCDate() - 30);
    jest.useFakeTimers().setSystemTime(farBefore);

    await renderHome(RAMADAN_PLAN);

    await screen.findByText('Solde du mois — restant');
    expect(screen.queryByText('Le Ramadan approche')).toBeNull();
    jest.useRealTimers();
  });
});
