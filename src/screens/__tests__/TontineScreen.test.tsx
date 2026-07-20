import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { listTontinePayments, listTontineRounds } from '../../db/repositories';
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
import { nextMonthKey, previousMonthKey } from '../../calendar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { formatMonthLabel } from '../../i18n/dateFormat';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { formatMoney } from '../../money';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createTontineGroupWithMembers } from '../../tontine';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { TontineScreen } from '../TontineScreen';

const TONTINE_PLAN: Plan = {
  id: 'tontine-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'tontine', type: 'feature', booleanValue: true }],
};

function renderScreen(plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <SubscriptionProvider>
            <TontineScreen />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('TontineScreen (US-024)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  /** US-068: no group yet on the free plan → straight to the paywall, tontine row highlighted. */
  it('opens the paywall with the tontine row highlighted when the plan does not include tontine', async () => {
    await renderScreen();

    expect(await screen.findByText('Gratuit vs Pro')).toBeTruthy();
    expect(screen.getByTestId('paywall-row-tontine').props.style).toMatchObject({ borderWidth: 2 });
    expect(screen.queryByText('Créer une tontine')).toBeNull();
  });

  /** US-068's 4th criterion: a group created while Pro stays fully readable after a downgrade. */
  it('keeps an existing group visible and readable after the plan drops tontine', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen();

    expect(await screen.findByText('Tontine famille')).toBeTruthy();
    expect(screen.queryByText('Gratuit vs Pro')).toBeNull();
  });

  it('shows the disclaimer and creation CTA when entitled with no group yet', async () => {
    await renderScreen(TONTINE_PLAN);

    expect(
      await screen.findByText(/ne collecte, ne détient et ne transfère aucun argent/),
    ).toBeTruthy();
    expect(await screen.findByText('Créer une tontine')).toBeTruthy();
  });

  it('opens the group creation form', async () => {
    await renderScreen(TONTINE_PLAN);

    await fireEvent.press(await screen.findByText('Créer une tontine'));

    expect(await screen.findByText('Nouvelle tontine')).toBeTruthy();
  });

  it('shows the current round, my round, and calendar for an existing group', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);

    const thisMonth = new Date().toISOString().slice(0, 7);
    expect(await screen.findByText('Tontine famille')).toBeTruthy();
    expect(await screen.findByText('2 membres')).toBeTruthy();
    expect(
      await screen.findAllByText(`Tour 1 sur 2 · ${formatMonthLabel(thisMonth, 'fr')}`),
    ).not.toHaveLength(0);
    expect(await screen.findByText(/Bénéficiaire : Youssef/)).toBeTruthy();
    expect(await screen.findByText(/C'est ton tour ce mois-ci/)).toBeTruthy();
  });

  it('toggles a member payment status for the current round', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);
    await screen.findByText('Tontine famille');

    const pendingRows = await screen.findAllByText('En attente');
    await fireEvent.press(pendingRows[0]);

    const payments = await listTontinePayments(mockFakeDb);
    expect(payments.filter((p) => p.status === 'paid')).toHaveLength(1);
    expect(await screen.findByText('1/2 payé')).toBeTruthy();
    expect(await screen.findAllByText('Payé')).not.toHaveLength(0);
  });

  it('shows each member with an amount and a paid/pending status, and badges the beneficiary', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);
    await screen.findByText('Tontine famille');

    expect(await screen.findAllByText(formatMoney(100000, 'MAD', 'fr'))).toHaveLength(2);
    expect(await screen.findByText('Bénéficiaire - reçoit ce tour')).toBeTruthy();
    expect(await screen.findAllByText('En attente')).toHaveLength(2);
  });

  it('closes a round once every member has paid, showing it as closed', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);
    await screen.findByText('Tontine famille');

    expect(screen.queryByText('Clôturer le tour')).toBeNull();

    const pendingRows = await screen.findAllByText('En attente');
    await fireEvent.press(pendingRows[0]);
    await fireEvent.press(await screen.findByText('En attente'));

    await fireEvent.press(await screen.findByText('Clôturer le tour'));

    expect(await screen.findByText('Tour clôturé')).toBeTruthy();
    expect(screen.queryByText('Clôturer le tour')).toBeNull();
  });

  it('highlights an upcoming personal round with month, round number and amount', async () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: thisMonth,
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 1,
    });

    await renderScreen(TONTINE_PLAN);

    const nextMonth = nextMonthKey(thisMonth);
    const potLabel = formatMoney(200000, 'MAD', 'fr');
    expect(
      await screen.findByText(
        `Ton tour arrive en ${formatMonthLabel(nextMonth, 'fr')} (tour 2). Tu recevras ${potLabel}.`,
      ),
    ).toBeTruthy();
  });

  it('shows a receipt for a personal round already in the past', async () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = previousMonthKey(thisMonth);
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: lastMonth,
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);

    const potLabel = formatMoney(200000, 'MAD', 'fr');
    expect(
      await screen.findByText(
        `Tu as reçu ${potLabel} au tour 1 (${formatMonthLabel(lastMonth, 'fr')}).`,
      ),
    ).toBeTruthy();
  });

  it('greys past rounds, highlights the current one, and labels my round "Toi" in the horizontal calendar', async () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = previousMonthKey(thisMonth);
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: lastMonth,
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 1,
    });
    const rounds = await listTontineRounds(mockFakeDb);
    const pastRound = rounds.find((r) => r.roundNumber === 1)!;
    const currentRoundRow = rounds.find((r) => r.roundNumber === 2)!;

    await renderScreen(TONTINE_PLAN);
    await screen.findByText('Tontine famille');

    const pastTile = await screen.findByTestId(`tontine-round-tile-${pastRound.id}`);
    expect(pastTile.props.style).toMatchObject({ opacity: 0.5 });
    expect(within(pastTile).getByText('Youssef')).toBeTruthy();

    const currentTile = await screen.findByTestId(`tontine-round-tile-${currentRoundRow.id}`);
    expect(currentTile.props.style).toMatchObject({ opacity: 1 });
    expect(within(currentTile).getByText('Toi')).toBeTruthy();
  });

  it('toggles the reminder opt-in', async () => {
    await createTontineGroupWithMembers(mockFakeDb, {
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      currencyCode: 'MAD',
      startMonth: new Date().toISOString().slice(0, 7),
      memberNames: ['Youssef', 'Salma'],
      selfIndex: 0,
    });

    await renderScreen(TONTINE_PLAN);

    await fireEvent.press(await screen.findByText('Activer le rappel'));

    expect(await screen.findByText('Désactiver le rappel')).toBeTruthy();
  });
});
