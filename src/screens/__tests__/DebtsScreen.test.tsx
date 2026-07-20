import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createDebt, createDebtRepayment, createHousehold } from '../../db/repositories';
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
import { DebtsScreen } from '../DebtsScreen';

const DEBTS_PLAN: Plan = {
  id: 'debts-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'debts', type: 'feature', booleanValue: true }],
};

function renderScreen(plan?: Plan, onBack: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <SubscriptionProvider>
            <DebtsScreen onBack={onBack} />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

describe('DebtsScreen (US-048)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  /** US-068: no debt yet on the free plan → straight to the paywall, debts row highlighted. */
  it('opens the paywall with the debts row highlighted when the plan does not include debts', async () => {
    renderScreen();

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
    expect(screen.getByTestId('paywall-row-tontine').props.style).toMatchObject({ borderWidth: 2 });
  });

  /** US-068's 4th criterion: a debt recorded while Pro stays fully readable after a downgrade, but
   *  adding a *new* one is gated. */
  it('keeps an existing debt visible and gates adding a new one after the plan drops debts', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Test', currencyCode: 'MAD' });
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Karim',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: CURRENT_MONTH + '-01',
      dueDate: null,
    });

    renderScreen();

    expect(await screen.findByText('Karim')).toBeTruthy();
    expect(screen.queryByText('Gratuit vs Pro')).toBeNull();

    await fireEvent.press(screen.getByText('Ajouter'));

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
  });

  it('shows the cultural-framing subtitle', async () => {
    renderScreen(DEBTS_PLAN);

    expect(
      await screen.findByText('Entre proches — sans intérêt, juste pour se souvenir.'),
    ).toBeTruthy();
  });

  it('shows an empty state with a way to add a debt when there is none', async () => {
    renderScreen(DEBTS_PLAN);

    expect(
      await screen.findByText('Aucune dette enregistrée. Ajoutez-en une pour vous en souvenir.'),
    ).toBeTruthy();
    expect(screen.getAllByText('Ajouter').length).toBeGreaterThan(0);
  });

  it('shows both net totals at zero with nothing recorded', async () => {
    renderScreen(DEBTS_PLAN);

    expect(await screen.findByText('On me doit')).toBeTruthy();
    expect(await screen.findByText('Je dois')).toBeTruthy();
    expect((await screen.findAllByText(/0,00 MAD/)).length).toBeGreaterThanOrEqual(2);
  });

  it('shows a debt row with counterparty, loan date, due date, and amount', async () => {
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-06-01',
      dueDate: '2026-09-01',
    });
    renderScreen(DEBTS_PLAN);

    expect(await screen.findByText('Salma')).toBeTruthy();
    expect(await screen.findByText(/2026-06-01.*2026-09-01/)).toBeTruthy();
    expect((await screen.findAllByText(/500,00 MAD/)).length).toBeGreaterThan(0);
  });

  it('shows "pas d\'échéance" for a debt with no due date', async () => {
    await createDebt(mockFakeDb, {
      label: 'Dette épicerie',
      counterparty: 'Épicerie du coin',
      direction: 'household_owes',
      amountMinor: 12000,
      currencyCode: 'MAD',
      date: '2026-06-01',
    });
    renderScreen(DEBTS_PLAN);

    expect(await screen.findByText(/Pas d'échéance/)).toBeTruthy();
  });

  it('recalculates the totals once a debt is recorded', async () => {
    renderScreen(DEBTS_PLAN);

    fireEvent.press((await screen.findAllByText('Ajouter'))[0]);
    fireEvent.press(await screen.findByText('On me doit'));
    fireEvent.changeText(await screen.findByLabelText('Personne'), 'Karim');
    fireEvent.changeText(await screen.findByLabelText('Montant'), '500');
    fireEvent.press(await screen.findByText('Enregistrer'));

    expect(await screen.findByText('Karim')).toBeTruthy();
    expect((await screen.findAllByText(/500,00 MAD/)).length).toBeGreaterThan(0);
  });

  it('shows a "échéance ce mois" badge when the due date falls in the current month', async () => {
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-01-01',
      dueDate: `${CURRENT_MONTH}-20`,
    });
    renderScreen(DEBTS_PLAN);

    expect(await screen.findByText('Échéance ce mois')).toBeTruthy();
  });

  it('excludes a fully settled debt from the totals but keeps it listed as "Soldée"', async () => {
    const debt = await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-01-01',
    });
    await createDebtRepayment(mockFakeDb, { debtId: debt.id, amountMinor: 50000, date: '2026-02-01' });

    renderScreen(DEBTS_PLAN);

    expect(await screen.findByText('Soldée')).toBeTruthy();
    expect((await screen.findAllByText(/0,00 MAD/)).length).toBeGreaterThanOrEqual(2);
  });

  it('uses the household currency for totals and rows', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Nadia',
      direction: 'household_owes',
      amountMinor: 5000,
      currencyCode: 'EUR',
      date: '2026-01-01',
    });

    renderScreen(DEBTS_PLAN);

    expect((await screen.findAllByText(/50,00 €/)).length).toBeGreaterThan(0);
  });

  it('opens the debt detail on tap', async () => {
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-01-01',
    });
    renderScreen(DEBTS_PLAN);

    fireEvent.press(await screen.findByText('Salma'));

    expect(await screen.findByText('Reste dû')).toBeTruthy();
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    renderScreen(DEBTS_PLAN, onBack);

    fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
