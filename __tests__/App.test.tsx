import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import { createFakeDatabase } from '../src/db/testUtils/createFakeDatabase';

const mockOpenDatabaseSync = jest.fn((_databaseName: string) => createFakeDatabase().db);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (databaseName: string) => mockOpenDatabaseSync(databaseName),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import App from '../App';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { __resetDatabaseForTests } from '../src/db/client';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import i18n from '../src/i18n/i18n';

async function goToProfileTab() {
  await fireEvent.press(screen.getByText('Profil'));
}

// Every fresh install lands on the onboarding flow (US-023, no `user_settings` row yet) — tests
// that only care about the running app walk through it once with the French/Maroc defaults.
async function completeOnboarding() {
  await fireEvent.press(await screen.findByText('Commencer'));
  await screen.findByText('Bienvenue sur Mizaniyati');
  // The market is never pre-selected (US-003): "Continuer" stays disabled until it is chosen.
  await fireEvent.press(screen.getByText('Maroc'));
  await fireEvent.press(screen.getByText('Continuer'));
  // The privacy commitments gate the dashboard (US-004).
  await fireEvent.press(await screen.findByText("J'ai compris, continuer"));
  // …and the household has to be named before it (US-005).
  await fireEvent.changeText(await screen.findByLabelText('Votre prénom'), 'Youssef');
  await fireEvent.changeText(screen.getByLabelText('Nom du foyer'), 'Famille Benali');
  await fireEvent.press(screen.getByText('Créer mon foyer'));
  // "Accueil" is ambiguous once the dashboard mounts (tab bar label + screen title) — wait on a
  // dashboard-only string instead.
  await screen.findByText('Dépense');
}

describe('App', () => {
  // `i18n` is a global singleton: a test that leaves it in another language would otherwise decide
  // what the next test's onboarding copy says.
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  beforeEach(() => {
    // The mocked `expo-sqlite` returns a fresh fake DB per `openDatabaseSync` call, but
    // `client.ts` memoizes that call — reset the memo so each test starts from a clean DB
    // (no leftover `user_settings` row from a previous test's completed onboarding).
    __resetDatabaseForTests();
  });

  it('shows the welcome screen on first launch, then language & country, then the dashboard', async () => {
    await render(<App />);

    // US-001: the welcome screen fronts the flow, with the no-bank badge above the fold.
    expect(await screen.findByText('Le budget de la famille, clair et privé')).toBeTruthy();
    expect(screen.getByText('Aucune connexion bancaire')).toBeTruthy();

    await fireEvent.press(screen.getByText('Commencer'));

    expect(await screen.findByText('Bienvenue sur Mizaniyati')).toBeTruthy();
    expect(screen.getByText('Devise : MAD')).toBeTruthy();

    await fireEvent.press(screen.getByText('Maroc'));
    await fireEvent.press(screen.getByText('Continuer'));

    // US-004: the zero-bank promise is acknowledged before the dashboard, never assumed.
    expect(await screen.findByText('Zéro accès bancaire')).toBeTruthy();
    await fireEvent.press(screen.getByText("J'ai compris, continuer"));

    // US-005: the household is named, and the dashboard greets by first name.
    await fireEvent.changeText(await screen.findByLabelText('Votre prénom'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du foyer'), 'Famille Benali');
    await fireEvent.press(screen.getByText('Créer mon foyer'));

    expect(await screen.findByText('Dépense')).toBeTruthy();
    expect(await screen.findByText('Bonjour, Youssef')).toBeTruthy();
    expect(screen.getByText('Famille Benali')).toBeTruthy();
    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
  });

  it('starts on the Accueil tab with the dashboard (no operations yet)', async () => {
    await render(<App />);
    await completeOnboarding();

    // "Accueil" appears twice: the tab bar label and the dashboard's own title.
    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
    expect(await screen.findByText('Dépense')).toBeTruthy();
    expect(screen.getByText('Ajoute ta première opération pour démarrer')).toBeTruthy();
  });

  it('renders all four tab bar entries and navigates between screens', async () => {
    await render(<App />);
    await completeOnboarding();

    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
    expect(screen.getByText('Catégories')).toBeTruthy();
    expect(screen.getByText('Tontine')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();

    await fireEvent.press(screen.getByText('Catégories'));
    expect(screen.getAllByText('Catégories').length).toBeGreaterThan(0);
    // The "add category" control is now the header's + icon action (labelled for a11y).
    expect(await screen.findByLabelText('Ajouter une catégorie')).toBeTruthy();
    // Default Morocco categories (US-009) are seeded at startup and listed here.
    expect(screen.getByText('Courses')).toBeTruthy();

    await fireEvent.press(screen.getByText('Tontine'));
    expect(screen.getAllByText('Tontine').length).toBeGreaterThan(0);
    // App.tsx defaults to FREE_PLAN, which doesn't include the tontine feature (US-024) —
    // the tab shows the Pro upsell rather than the group dashboard.
    expect(await screen.findByText('La tontine fait partie du forfait Pro.')).toBeTruthy();
  });

  it('hosts the theme demo on the Profil tab and toggles dark mode + senior mode', async () => {
    await render(<App />);
    await completeOnboarding();
    await goToProfileTab();

    expect(screen.getByText(/Thème : clair/)).toBeTruthy();

    await fireEvent.press(screen.getByText('sombre'));
    expect(screen.getByText(/Thème : sombre/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Activer le mode senior'));
    expect(screen.getByText(/Thème : sombre · senior/)).toBeTruthy();
  });

  it('cycles through the three languages, flipping RTL along the way (tab labels included)', async () => {
    const allowRTLSpy = jest.spyOn(I18nManager, 'allowRTL');
    const forceRTLSpy = jest.spyOn(I18nManager, 'forceRTL');

    await render(<App />);
    await completeOnboarding();
    await goToProfileTab();

    // The language row shows the current language and cycles fr → ar → en → fr on press. It has
    // to wrap: a two-way toggle left English unreachable (US-002).
    await fireEvent.press(screen.getByText('Français'));
    expect(await screen.findByText('العربية')).toBeTruthy();
    expect(screen.getAllByText('الرئيسية').length).toBeGreaterThan(0); // Arabic home tab label
    expect(allowRTLSpy).toHaveBeenLastCalledWith(true);
    expect(forceRTLSpy).toHaveBeenLastCalledWith(true);

    await fireEvent.press(screen.getByText('العربية'));
    expect(await screen.findByText('English')).toBeTruthy();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(allowRTLSpy).toHaveBeenLastCalledWith(false);
    expect(forceRTLSpy).toHaveBeenLastCalledWith(false);

    await fireEvent.press(screen.getByText('English'));
    expect(await screen.findByText('Français')).toBeTruthy();
    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);

    allowRTLSpy.mockRestore();
    forceRTLSpy.mockRestore();
  });

  it('displays dashboard amounts left-to-right, with locale-appropriate digits', async () => {
    await render(<App />);
    await completeOnboarding();

    // The dashboard's Revenus/Dépenses footer stats render amounts LTR (wrapped in invisible
    // left-to-right marks — hence a substring regex, not an exact match). French (fr-MA):
    // Western digits.
    expect(screen.getAllByText(/0,00/).length).toBeGreaterThan(0);

    // Switch to Arabic via the Profil tab's language toggle, then return to the dashboard.
    await goToProfileTab();
    await fireEvent.press(screen.getByText('Français'));
    await fireEvent.press(screen.getAllByText('الرئيسية')[0]); // Arabic "Accueil" tab label

    // Arabic: Arabic-indic digits (٠) with the Arabic decimal separator (٫).
    expect(screen.getAllByText(/٠٫٠٠/).length).toBeGreaterThan(0);
  });
});
