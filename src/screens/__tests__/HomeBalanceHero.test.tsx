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
import { createCategory, createHousehold, createMember, createTransaction } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Category, Member } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { gradients } from '../../theme/tokens';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

const THIS_MONTH = `${new Date().toISOString().slice(0, 7)}-05T10:00:00.000Z`;

let category: Category;
let member: Member;

async function seed({ currencyCode = 'MAD' } = {}) {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode });
  category = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  member = await createMember(mockFakeDb, { name: 'Youssef' });
}

async function addTransaction(type: 'income' | 'expense', amountMinor: number, currencyCode = 'MAD') {
  return createTransaction(mockFakeDb, {
    type,
    amountMinor,
    currencyCode,
    categoryId: category.id,
    memberId: member.id,
    occurredAt: THIS_MONTH,
  });
}

async function renderHome() {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <ExpenseEntryProvider>
            <HomeScreen />
          </ExpenseEntryProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

/** The gradient the hero card was handed. */
function heroGradient(): string[] {
  return screen.getByTestId('balance-hero').props.colors;
}

/**
 * Scoped to the hero: the big balance and the income total both render "5.000" somewhere, so an
 * unscoped `/5.000/` matches both — the same loose-regex trap the money tests hit in US-062.
 */
function hero() {
  return within(screen.getByTestId('balance-hero'));
}

/** The hero's big figure, stripped of its LTR isolation marks. */
async function heroBalance(): Promise<string> {
  await screen.findByText(fr.home.balanceLabel);
  const amounts = hero()
    .getAllByText(/[0-9٠-٩]/)
    .map((node) => String(node.props.children).replace(/‎/g, ''));
  return amounts[0];
}

describe('balance hero (US-007)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('shows the month balance as income minus expenses', async () => {
    await seed();
    await addTransaction('income', 500000);
    await addTransaction('expense', 120000);
    await renderHome();

    // 5000 - 1200 = 3800.
    expect(await heroBalance()).toBe('3.800');
  });

  it('shows the month income and expense totals under the balance', async () => {
    await seed();
    await addTransaction('income', 500000);
    await addTransaction('expense', 120000);
    await renderHome();

    expect(await screen.findByText(fr.home.balanceIncome)).toBeTruthy();
    expect(screen.getByText(fr.home.balanceExpense)).toBeTruthy();
    expect(hero().getAllByText(/5\.000,00/).length).toBeGreaterThan(0);
    expect(hero().getAllByText(/1\.200,00/).length).toBeGreaterThan(0);
  });

  it('uses the household currency, not the launch market default', async () => {
    await seed({ currencyCode: 'EUR' });
    await addTransaction('income', 500000, 'EUR');
    await renderHome();

    expect(await screen.findByText('EUR')).toBeTruthy();
    expect(screen.queryByText('MAD')).toBeNull();
  });

  describe('a month in the red', () => {
    /**
     * The criterion asks for the alert color on a negative balance. It cannot mean coral *text*:
     * coral on the teal gradient reads at 1.49:1, invisible. The card itself turns red instead,
     * which keeps the figure legible — see `gradients.negative`.
     */
    it('turns the hero card to the alert gradient', async () => {
      await seed();
      await addTransaction('income', 100000);
      await addTransaction('expense', 300000);
      await renderHome();

      expect(await heroBalance()).toBe('-2.000');
      expect(heroGradient()).toEqual(gradients.negative);
    });

    it('keeps the normal gradient while the balance is positive', async () => {
      await seed();
      await addTransaction('income', 300000);
      await renderHome();

      expect(await heroBalance()).toBe('3.000');
      expect(heroGradient()).toEqual(gradients.balance);
    });

    it('keeps the normal gradient at exactly zero', async () => {
      await seed();
      await addTransaction('income', 100000);
      await addTransaction('expense', 100000);
      await renderHome();

      await screen.findByText(fr.home.balanceLabel);
      expect(heroGradient()).toEqual(gradients.balance);
    });
  });

  /**
   * Through the entry sheet, as a user would — not by remounting the screen, which would prove
   * nothing about recomputing in place. The FAB lives in the tab bar, which this screen-level
   * render doesn't mount, so the empty state's own CTA opens the sheet instead.
   */
  it('recomputes the balance after a new transaction, without a reload', async () => {
    await seed();
    await renderHome();

    await fireEvent.press(await screen.findByText(fr.home.emptyStateExpense));
    await fireEvent.press(await screen.findByText('Courses'));
    const memberChips = await screen.findAllByText('Youssef');
    await fireEvent.press(memberChips[memberChips.length - 1]);
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '1500');
    await fireEvent.press(screen.getByText(fr.expenseForm.submit));

    // The dashboard underneath the confirmation is already down 1500. `waitFor`, because saving
    // kicks off a reload the press does not await.
    await waitFor(async () => expect(await heroBalance()).toBe('-1.500'), { timeout: 5000 });
  });

  it('counts only the selected month', async () => {
    await seed();
    await addTransaction('income', 500000);
    await createTransaction(mockFakeDb, {
      type: 'income',
      amountMinor: 900000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2020-01-05T10:00:00.000Z',
    });
    await renderHome();

    // The old month's 9000 is not in this month's balance.
    expect(await heroBalance()).toBe('5.000');
  });
});
