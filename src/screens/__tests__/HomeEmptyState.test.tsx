import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createCategory,
  createHousehold,
  createMember,
  createTransaction,
  saveLanguageCountry,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Category, Member } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { monthKeyOf } from '../../i18n/dateFormat';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

const NOW = new Date();
const THIS_MONTH = monthKeyOf(NOW);
const LAST_MONTH = monthKeyOf(new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1));

let category: Category;
let member: Member;

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  category = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  member = await createMember(mockFakeDb, { name: 'Youssef' });
}

async function add(type: 'expense' | 'income', amountMinor: number, monthKey = THIS_MONTH) {
  await createTransaction(mockFakeDb, {
    type,
    amountMinor,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: member.id,
    occurredAt: `${monthKey}-05T10:00:00.000Z`,
    note: 'Une opération',
  });
}

async function renderHome(plan?: Plan) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={plan}>
            <ExpenseEntryProvider>
              <HomeScreen />
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

async function heroFigure(): Promise<string> {
  const amount = await screen.findByTestId('balance-hero-amount');
  return String(amount.props.children).replace(/‎/g, '');
}

describe('dashboard empty state (US-015)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  describe('nothing recorded yet', () => {
    it('shows a dash and the currency rather than a zero', async () => {
      await seed();
      await renderHome();

      expect(await heroFigure()).toBe('—');
      expect(within(screen.getByTestId('balance-hero')).getByText('MAD')).toBeTruthy();
    });

    it('invites the first transaction', async () => {
      await seed();
      await renderHome();

      expect(await screen.findByText(fr.home.emptyState)).toBeTruthy();
    });

    it('offers both an expense and a voice route', async () => {
      await seed();
      await renderHome();

      const card = within(await screen.findByTestId('first-run-empty-state'));
      expect(card.getByText(fr.home.emptyStateExpense)).toBeTruthy();
      expect(card.getByText(fr.home.emptyStateVoice)).toBeTruthy();
    });

    it('opens the entry sheet from the expense action', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByText(fr.home.emptyStateExpense));

      expect(await screen.findByText(fr.expenseForm.titleExpense)).toBeTruthy();
    });

    /** Voice entry is Pro-gated (US-020a) — a free household sees the upsell, not a live mic. */
    it('shows the Pro upsell from the voice action on the free plan', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByText(fr.home.emptyStateVoice));

      expect(await screen.findByText(fr.voiceCapture.upsellMessage)).toBeTruthy();
    });

    it('opens the voice-capture sheet from the voice action on the Pro plan', async () => {
      await seed();
      // The mic explainer (US-020a) is read from `user_settings`, which onboarding always
      // creates before the dashboard is reachable — `seed()` above skips onboarding entirely.
      await saveLanguageCountry(mockFakeDb, { languageCode: 'fr', countryCode: 'MA', currencyCode: 'MAD' });
      await renderHome(PRO_PLAN);

      await fireEvent.press(await screen.findByText(fr.home.emptyStateVoice));

      expect(await screen.findByText(fr.voiceCapture.explainerTitle)).toBeTruthy();
    });
  });

  /**
   * A zero balance is a fact about the month; a dash means there is nothing to add up. Collapsing
   * the two would tell a household that broke even that it had recorded nothing.
   */
  it('shows a real zero when the month nets out, not a dash', async () => {
    await seed();
    await add('income', 100000);
    await add('expense', 100000);
    await renderHome();

    expect(await heroFigure()).toBe('0');
  });

  describe('once the first transaction is recorded', () => {
    it('drops the first-run card', async () => {
      await seed();
      await add('expense', 10000);
      await renderHome();

      await screen.findByText(fr.home.recentTitle);
      expect(screen.queryByTestId('first-run-empty-state')).toBeNull();
      expect(screen.queryByText(fr.home.emptyState)).toBeNull();
    });

    /**
     * The invitation is about the household, not the month: "add your first transaction" on an
     * empty month of a household with history would be plainly wrong.
     */
    it('does not come back on an empty month', async () => {
      await seed();
      await add('expense', 10000, LAST_MONTH);
      await renderHome();
      await screen.findByText(fr.home.balanceLabel);

      // This month is empty, but the household has recorded before.
      expect(screen.queryByTestId('first-run-empty-state')).toBeNull();
      expect(screen.getByText(fr.home.monthEmpty)).toBeTruthy();
    });

    it('still shows a dash on that empty month — there is nothing to add up', async () => {
      await seed();
      await add('expense', 10000, LAST_MONTH);
      await renderHome();

      expect(await heroFigure()).toBe('—');
    });

    /**
     * US-015 says the empty state disappears "définitivement". Read as: it goes because there *is*
     * data. A household that deletes everything is back to an empty app, and the invitation is
     * useful again — this pins that reading so the next reader knows it was a decision.
     */
    it('comes back if the household deletes everything', async () => {
      await seed();
      await add('expense', 10000);
      await renderHome();
      await screen.findByText(fr.home.recentTitle);
      expect(screen.queryByTestId('first-run-empty-state')).toBeNull();

      await fireEvent.press(screen.getByText('Une opération'));
      await fireEvent.press(await screen.findByText(fr.expenseForm.delete));
      await fireEvent.press(await screen.findByText(fr.expenseForm.deleteConfirmYes));

      expect(await screen.findByTestId('first-run-empty-state')).toBeTruthy();
    });

    it('disappears as soon as the first transaction is saved, without a reload', async () => {
      await seed();
      await renderHome();
      await screen.findByTestId('first-run-empty-state');

      await fireEvent.press(screen.getByText(fr.home.emptyStateExpense));
      await fireEvent.press(await screen.findByText('Courses'));
      const chips = await screen.findAllByText('Youssef');
      await fireEvent.press(chips[chips.length - 1]);
      await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '15');
      await fireEvent.press(screen.getByText(fr.expenseForm.submit));

      expect(await screen.findByText(fr.confirmation.title)).toBeTruthy();
      expect(screen.queryByTestId('first-run-empty-state')).toBeNull();
    });
  });
});
