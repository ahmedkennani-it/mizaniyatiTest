import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

const actualPurchases: typeof import('../../purchases') = jest.requireActual('../../purchases');
const mockPurchasePro = jest.fn<ReturnType<typeof actualPurchases.purchasePro>, Parameters<typeof actualPurchases.purchasePro>>(
  actualPurchases.purchasePro,
);
jest.mock('../../purchases', () => ({
  ...jest.requireActual('../../purchases'),
  purchasePro: (...args: Parameters<typeof actualPurchases.purchasePro>) => mockPurchasePro(...args),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createHousehold, getSubscription, upsertSubscription } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { PurchaseCancelledError, PurchaseNetworkError } from '../../purchases';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { PaywallScreen } from '../PaywallScreen';

function renderScreen(
  onBack: () => void = jest.fn(),
  highlightKey?: React.ComponentProps<typeof PaywallScreen>['highlightKey'],
) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <SubscriptionProvider>
          <PaywallScreen onBack={onBack} highlightKey={highlightKey} />
        </SubscriptionProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('PaywallScreen (US-029)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the free status and a trial offer with no subscription yet', async () => {
    await renderScreen();

    expect(await screen.findByText('Vous êtes sur le forfait Gratuit.')).toBeTruthy();
    expect(screen.getByText("Commencer l'essai gratuit de 14 jours")).toBeTruthy();
  });

  /** US-067's 1st criterion: the trial CTA carries the no-commitment mention. */
  it('shows the no-commitment mention alongside the trial CTA', async () => {
    await renderScreen();

    expect(await screen.findByText("Commencer l'essai gratuit de 14 jours")).toBeTruthy();
    expect(
      screen.getByText('Aucune carte bancaire requise. Sans engagement, annulable à tout moment.'),
    ).toBeTruthy();
  });

  it('hides the no-commitment mention once the trial has already been used', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    await renderScreen();

    await screen.findByText('Votre essai gratuit est terminé. Vous êtes revenu au forfait Gratuit.');
    expect(
      screen.queryByText('Aucune carte bancaire requise. Sans engagement, annulable à tout moment.'),
    ).toBeNull();
  });

  it('shows the Gratuit vs Pro comparison table', async () => {
    await renderScreen();

    await screen.findByText('Gratuit vs Pro');
    expect(screen.getByText('Tontine & dettes')).toBeTruthy();
    expect(screen.getByText('Zakat & mode Ramadan')).toBeTruthy();
    expect(screen.getByText('Suivi dépenses & revenus')).toBeTruthy();
    expect(screen.getAllByText('Illimité').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeTruthy(); // FREE_PLAN's categories.max
  });

  it('always reminds of the zero bank connection promise', async () => {
    await renderScreen();

    expect(await screen.findByText('Toujours zéro connexion bancaire')).toBeTruthy();
  });

  /** US-065's baseline row: core tracking is never gated, on either plan. */
  it('shows expense & income tracking as included on both plans', async () => {
    await renderScreen();

    await screen.findByText('Suivi dépenses & revenus');
    expect(screen.getAllByText('✓').length).toBeGreaterThanOrEqual(2);
  });

  it('starts a trial and shows the trial-active status with an expiry date', async () => {
    await renderScreen();
    await screen.findByText('Vous êtes sur le forfait Gratuit.');

    await fireEvent.press(screen.getByText("Commencer l'essai gratuit de 14 jours"));

    expect(await screen.findByText(/Essai Pro actif/)).toBeTruthy();
    expect(screen.queryByText("Commencer l'essai gratuit de 14 jours")).toBeNull();
  });

  it('shows the trial-ended status and no second trial offer once it has expired', async () => {
    await upsertSubscription(mockFakeDb, {
      planId: 'pro',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });

    await renderScreen();

    expect(
      await screen.findByText(
        'Votre essai gratuit est terminé. Vous êtes revenu au forfait Gratuit.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Commencer l'essai gratuit de 14 jours")).toBeNull();
  });

  /** US-065's 4th criterion: opening the paywall from a hit limit highlights that row. */
  it('highlights the row matching the trigger that opened the paywall', async () => {
    await renderScreen(jest.fn(), 'categories.max');

    const highlighted = await screen.findByTestId('paywall-row-categories.max');
    expect(highlighted.props.style).toMatchObject({ borderWidth: 2 });

    const other = await screen.findByTestId('paywall-row-members.max');
    expect(other.props.style).not.toMatchObject({ borderWidth: 2 });
  });

  it('highlights the combined row for either of its two entitlement keys', async () => {
    await renderScreen(jest.fn(), 'debts');

    const highlighted = await screen.findByTestId('paywall-row-tontine');
    expect(highlighted.props.style).toMatchObject({ borderWidth: 2 });
  });

  it('highlights nothing when opened with no trigger', async () => {
    await renderScreen();

    const row = await screen.findByTestId('paywall-row-categories.max');
    expect(row.props.style).not.toMatchObject({ borderWidth: 2 });
  });

  it('calls onBack when the back control is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    await fireEvent.press(screen.getByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('PaywallScreen — tarification et achat (US-066a/US-066b)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
    mockPurchasePro.mockClear();
  });

  it('shows both products with the launch market’s MAD prices and the annual discount badge', async () => {
    await renderScreen();

    expect(await screen.findByText(/39,00 MAD.*mois/)).toBeTruthy();
    expect(await screen.findByText(/279,00 MAD.*an/)).toBeTruthy();
    expect(await screen.findByText('-40%')).toBeTruthy();
  });

  it('pre-selects the annual product', async () => {
    await renderScreen();

    const annualOption = await screen.findByTestId('paywall-product-annual');
    expect(annualOption.props.accessibilityState).toMatchObject({ selected: true });
    const monthlyOption = await screen.findByTestId('paywall-product-monthly');
    expect(monthlyOption.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('lets the household switch to the monthly product', async () => {
    await renderScreen();
    await screen.findByTestId('paywall-product-monthly');

    fireEvent.press(screen.getByTestId('paywall-product-monthly'));

    expect(screen.getByTestId('paywall-product-monthly').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId('paywall-product-annual').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('shows prices in the household’s own currency on a non-Moroccan market', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen();

    expect(await screen.findByText(/€.*mois/)).toBeTruthy();
  });

  it('purchases the selected product and unlocks Pro immediately', async () => {
    await renderScreen();
    await screen.findByText(/39,00 MAD.*mois/);

    fireEvent.press(screen.getByText("S'abonner"));

    expect(await screen.findByText('Vous êtes sur le forfait Pro.')).toBeTruthy();
    const subscription = await getSubscription(mockFakeDb);
    expect(subscription?.status).toBe('active');
    expect(subscription?.productId).toBe('annual');
  });

  it('purchases the monthly product when it is the one selected', async () => {
    await renderScreen();
    await screen.findByText(/39,00 MAD.*mois/);
    fireEvent.press(screen.getByText('Mensuel'));

    fireEvent.press(screen.getByText("S'abonner"));

    await screen.findByText('Vous êtes sur le forfait Pro.');
    const subscription = await getSubscription(mockFakeDb);
    expect(subscription?.productId).toBe('monthly');
  });

  it('hides the pricing section once the household is already Pro', async () => {
    await upsertSubscription(mockFakeDb, { planId: 'pro', status: 'active', productId: 'annual' });

    await renderScreen();

    await screen.findByText('Vous êtes sur le forfait Pro.');
    expect(screen.queryByText("S'abonner")).toBeNull();
  });

  /**
   * US-066a's "erreurs d'achat gérées sans crash" — a real store call can be cancelled by the
   * household or fail for lack of connection; the UI must show a message, not crash, and must not
   * leave a partial/corrupt subscription behind.
   */
  it('shows a friendly message and stays on Free when the purchase is cancelled, without crashing', async () => {
    mockPurchasePro.mockRejectedValueOnce(new PurchaseCancelledError());
    await renderScreen();
    await screen.findByText(/39,00 MAD.*mois/);

    fireEvent.press(screen.getByText("S'abonner"));

    expect(await screen.findByText("Achat annulé. Vous n'avez pas été débité.")).toBeTruthy();
    expect(await screen.findByText('Vous êtes sur le forfait Gratuit.')).toBeTruthy();
    expect(await getSubscription(mockFakeDb)).toBeNull();
  });

  it('shows a friendly message and stays on Free on a simulated network failure, without crashing', async () => {
    mockPurchasePro.mockRejectedValueOnce(new PurchaseNetworkError());
    await renderScreen();
    await screen.findByText(/39,00 MAD.*mois/);

    fireEvent.press(screen.getByText("S'abonner"));

    expect(
      await screen.findByText("Échec de l'achat, vérifiez votre connexion et réessayez."),
    ).toBeTruthy();
    expect(await getSubscription(mockFakeDb)).toBeNull();
  });

  it('lets a household retry successfully after a failed attempt', async () => {
    mockPurchasePro.mockRejectedValueOnce(new PurchaseNetworkError());
    await renderScreen();
    await screen.findByText(/39,00 MAD.*mois/);
    fireEvent.press(screen.getByText("S'abonner"));
    await screen.findByText("Échec de l'achat, vérifiez votre connexion et réessayez.");

    fireEvent.press(screen.getByText("S'abonner"));

    expect(await screen.findByText('Vous êtes sur le forfait Pro.')).toBeTruthy();
    expect(mockPurchasePro).toHaveBeenCalledTimes(2);
  });
});
