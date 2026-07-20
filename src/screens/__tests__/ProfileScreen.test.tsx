import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createHousehold,
  createMember,
  getNotificationSettings,
  saveLanguageCountry,
  setBudgetAlertsEnabled,
  upsertSubscription,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ProfileScreen } from '../ProfileScreen';

function renderScreen() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider>
          <SubscriptionProvider>
            <ProfileScreen />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

/** Entry points to Pro-gated spec screens (e.g. Debts) need `useEntitlements()` in scope, and the
 *  profile hero's Pro badge/label reads `useSubscription()` — an active row must exist for real. */
async function renderScreenAsPro() {
  await upsertSubscription(mockFakeDb, { planId: 'pro', status: 'active' });
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={PRO_PLAN}>
          <SubscriptionProvider>
            <ProfileScreen />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ProfileScreen — alertes de plafond (US-019)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the opt-in button when notifications are off by default', async () => {
    await renderScreen();

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
  });

  it('opts in on press and persists the setting', async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByText('Activer les alertes'));

    expect(await screen.findByText('Désactiver les alertes')).toBeTruthy();
    expect(await getNotificationSettings(mockFakeDb)).toEqual({ budgetAlertsEnabled: true });
  });

  it('reflects an already-enabled setting on mount', async () => {
    await setBudgetAlertsEnabled(mockFakeDb, true);

    await renderScreen();

    expect(await screen.findByText('Désactiver les alertes')).toBeTruthy();
  });

  it('opts back out on a second press', async () => {
    await setBudgetAlertsEnabled(mockFakeDb, true);
    await renderScreen();

    await fireEvent.press(await screen.findByText('Désactiver les alertes'));

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
    expect(await getNotificationSettings(mockFakeDb)).toEqual({ budgetAlertsEnabled: false });
  });
});

describe('ProfileScreen — accès aux Dettes & prêts (US-048)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('opens the Debts screen from the "Famille & fonctionnalités" section', async () => {
    await renderScreenAsPro();

    await fireEvent.press(await screen.findByText('Dettes & prêts'));

    expect(await screen.findByText('On me doit')).toBeTruthy();
  });

  it('returns to the settings list from the Debts screen', async () => {
    await renderScreenAsPro();

    await fireEvent.press(await screen.findByText('Dettes & prêts'));
    await screen.findByText('On me doit');
    fireEvent.press(await screen.findByLabelText('Retour'));

    expect(await screen.findByText('Activer les alertes')).toBeTruthy();
  });
});

describe('ProfileScreen — aperçu Famille (US-053)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the member count next to the Famille section', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });

    renderScreen();

    expect(await screen.findByText('1 membre(s)')).toBeTruthy();
  });

  it('shows the Pro upsell hint on the Free plan (limited to 1 member)', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });

    renderScreen();

    expect(await screen.findByText('Passez à Pro pour ajouter des membres à votre foyer.')).toBeTruthy();
  });

  it('hides the upsell hint on the Pro plan', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });

    await renderScreenAsPro();

    await screen.findByText('1 membre(s)');
    expect(screen.queryByText('Passez à Pro pour ajouter des membres à votre foyer.')).toBeNull();
  });

  it('opens the full member list when the Famille preview is tapped', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });
    renderScreen();

    // "Famille" labels both the section header and the preview row's own title.
    const famille = await screen.findAllByText('Famille');
    fireEvent.press(famille[famille.length - 1]);

    expect(await screen.findByText('Youssef')).toBeTruthy();
    expect(screen.getByText('Gérez les membres de votre foyer et invitez-en de nouveaux.')).toBeTruthy();
  });
});

describe('ProfileScreen — carte de profil (US-055)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it("shows the household's own name, not its first member's", async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    await createMember(mockFakeDb, { name: 'Youssef' });

    renderScreen();

    // Not "Youssef" — that would be the pre-fix bug (member name mistaken for household name).
    expect(await screen.findByText('Famille Benali')).toBeTruthy();
    expect(screen.queryByText('Youssef')).toBeNull();
  });

  it('shows the household currency and country', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'FR',
      currencyCode: 'EUR',
    });

    renderScreen();

    expect((await screen.findAllByText('EUR')).length).toBeGreaterThan(0);
    expect(await screen.findByText(/France/)).toBeTruthy();
  });

  it('shows no Pro badge and the "Passer à Pro" entry on the Free plan', async () => {
    renderScreen();

    expect(await screen.findByText('Passer à Pro')).toBeTruthy();
    expect(screen.queryByText('Pro')).toBeNull();
  });

  it('shows a Pro badge and "Abonnement" (not "Passer à Pro") once subscribed', async () => {
    await renderScreenAsPro();

    expect(await screen.findByText('Pro')).toBeTruthy();
    expect(screen.getByText('Abonnement')).toBeTruthy();
    expect(screen.queryByText('Passer à Pro')).toBeNull();
  });

  it('shows the days remaining (not the plain Pro badge) during an active trial (US-067)', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });

    render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={PRO_PLAN}>
            <SubscriptionProvider>
              <ProfileScreen />
            </SubscriptionProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>,
    );

    expect(await screen.findByText('Essai — 3 jour(s) restant(s)')).toBeTruthy();
    expect(screen.queryByText('Pro')).toBeNull();
  });
});

describe('ProfileScreen — thème (US-059)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('offers clair / sombre / automatique and switches on tap', async () => {
    renderScreen();

    expect(await screen.findByText(/Thème : clair/)).toBeTruthy();

    fireEvent.press(screen.getByText('sombre'));
    expect(await screen.findByText(/Thème : sombre/)).toBeTruthy();

    // Back to "automatique" resolves to whatever the (unmocked, default light) test
    // environment reports for the system scheme — "clair" again, not stuck on "sombre".
    fireEvent.press(screen.getByText('automatique'));
    expect(await screen.findByText(/Thème : clair/)).toBeTruthy();
  });
});
