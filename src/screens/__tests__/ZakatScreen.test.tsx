import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createCategory,
  createHousehold,
  createMember,
  createZakatAssessment,
  listTransactions,
  listZakatAssessments,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ZakatScreen } from '../ZakatScreen';

const ZAKAT_PLAN: Plan = {
  id: 'zakat-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'zakat', type: 'feature', booleanValue: true }],
};

function renderScreen(onBack: () => void = jest.fn(), plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <SubscriptionProvider>
            <ZakatScreen onBack={onBack} />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ZakatScreen (US-025)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  /** US-068: no assessment yet on the free plan → straight to the paywall, zakat row highlighted. */
  it('opens the paywall with the zakat row highlighted when the plan does not include zakat', async () => {
    await renderScreen(jest.fn());

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
    expect(screen.getByTestId('paywall-row-zakat').props.style).toMatchObject({ borderWidth: 2 });
  });

  /** US-068's 4th criterion: an assessment saved while Pro stays fully readable after a downgrade,
   *  but saving a *new* one is gated. */
  it('keeps an existing assessment visible and gates saving a new one after the plan drops zakat', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Test', currencyCode: 'MAD' });
    await createZakatAssessment(mockFakeDb, {
      cashMinor: 1000000,
      goldSilverMinor: 0,
      investmentsMinor: 0,
      debtsMinor: 0,
      baseMinor: 1000000,
      dueMinor: 25000,
      aboveNisab: true,
      dueDate: null,
    });

    await renderScreen(jest.fn());

    expect(await screen.findByText('Historique')).toBeTruthy();
    expect(screen.queryByText('Gratuit vs Pro')).toBeNull();

    await fireEvent.press(await screen.findByText('Enregistrer & planifier le don'));

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
  });

  it('shows the disclaimer and defaults to the gold nisab basis', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    expect(await screen.findByText(/n'émet pas de fatwa/)).toBeTruthy();
    expect(await screen.findByText('Saisissez un prix pour calculer le nisab.')).toBeTruthy();
  });

  it('computes the nisab once a gold price is entered and saved', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    // `findBy*`: the screen loads its config asynchronously, so the fields only exist a tick later.
    await fireEvent.changeText(await screen.findByLabelText("Prix de l'or (par gramme)"), '600');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));

    // Nisab = 600 MAD/g * 85g = 51 000 MAD.
    expect(await screen.findByText(/51.000,00 MAD|51 000,00 MAD/)).toBeTruthy();
  });

  it('computes base and due, and marks above nisab once assets clear it', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText("Prix de l'or (par gramme)"), '100');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));
    // Nisab = 100 * 85 = 8 500 MAD.

    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '10000');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '1000');

    expect(await screen.findByText('Au-dessus du nisab · Zakat obligatoire')).toBeTruthy();
    // base = 10000 - 1000 = 9000 MAD, due = 225 MAD.
    expect(await screen.findByText(/225,00 MAD/)).toBeTruthy();
  });

  it('floors the base at zero when debts exceed assets', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText('Liquidités & comptes'), '100');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '500');

    expect(await screen.findByText(/Base zakatable: .?0,00 MAD/)).toBeTruthy();
  });

  it('computes and displays everything in the household currency, not a hardcoded default', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText("Prix de l'or (par gramme)"), '100');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));
    // Nisab = 100 * 85 = 8 500 EUR — the fr-MA formatter renders EUR with its own € symbol.
    expect(await screen.findByText(/8.500,00 €|8 500,00 €/)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '10000');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '1000');

    // base = 9000 EUR, due = 225 EUR — never MAD.
    expect(await screen.findByText(/225,00 €/)).toBeTruthy();
    expect(screen.queryByText(/MAD/)).toBeNull();
  });

  it('saves an assessment to history', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText('Liquidités & comptes'), '1000');
    await fireEvent.press(screen.getByText('Enregistrer & planifier le don'));

    const assessments = await listZakatAssessments(mockFakeDb);
    expect(assessments).toHaveLength(1);
    expect(assessments[0].baseMinor).toBe(100000);
  });

  /** US-043: "quand je tape 'Enregistrer & planifier le don', le montant est sauvegardé avec sa
   * date de calcul" — plus the chosen due date, when given. */
  it('saves the chosen due date alongside the calculation', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText('Liquidités & comptes'), '1000');
    await fireEvent.changeText(
      screen.getByLabelText('Date de versement prévue (optionnel)'),
      '2026-08-01',
    );
    await fireEvent.press(screen.getByText('Enregistrer & planifier le don'));

    const assessments = await listZakatAssessments(mockFakeDb);
    expect(assessments[0].dueDate).toBe('2026-08-01');
    expect(assessments[0].paidAt).toBeNull();
  });

  it('shows a note instead of "mark as paid" when no Zakat & dons category exists yet', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText("Prix de l'or (par gramme)"), '100');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));
    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '10000');
    await fireEvent.press(screen.getByText('Enregistrer & planifier le don'));

    expect(screen.queryByText('Marquer comme versé')).toBeNull();
    expect(
      await screen.findByText(
        'Créez une catégorie « Zakat & dons » pour pouvoir marquer un versement comme effectué.',
      ),
    ).toBeTruthy();
  });

  /** US-043: "elle est rattachée à la catégorie Zakat & dons et impacte son plafond une fois
   * versée" — marking paid must create a real expense Transaction in that category, since
   * category budgets are computed purely from `Transaction` rows. */
  it('marking a plan paid creates a linked expense transaction in the Zakat & dons category', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Zakat & dons',
      icon: 'hand-heart',
      color: '#B45309',
    });
    await createMember(mockFakeDb, { name: 'Youssef' });
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(await screen.findByLabelText("Prix de l'or (par gramme)"), '100');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));
    // Nisab = 8 500 MAD; base = 10000 - 1000 = 9000 MAD, due = 225 MAD (22 500 minor).
    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '10000');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '1000');
    await fireEvent.press(screen.getByText('Enregistrer & planifier le don'));

    await fireEvent.press(await screen.findByText('Marquer comme versé'));

    expect(await screen.findByText('Versé')).toBeTruthy();
    const transactions = await listTransactions(mockFakeDb);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: 'expense',
      categoryId: category.id,
      amountMinor: 22500,
    });
    const assessments = await listZakatAssessments(mockFakeDb);
    expect(assessments[0].paidAt).not.toBeNull();
    expect(assessments[0].transactionId).toBe(transactions[0].id);
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack, ZAKAT_PLAN);

    // The back link is now the header's chevron action (addressed by its a11y label).
    await fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
