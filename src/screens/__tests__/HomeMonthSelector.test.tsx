import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';
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
  createVault,
  createVaultContribution,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Category, Member } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { formatMonthLabel, monthKeyOf } from '../../i18n/dateFormat';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ar } from '../../i18n/locales/ar';
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

async function addTransaction(monthKey: string, amountMinor: number, note: string) {
  return createTransaction(mockFakeDb, {
    type: 'expense',
    amountMinor,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: member.id,
    occurredAt: `${monthKey}-05T10:00:00.000Z`,
    note,
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

function hero() {
  return within(screen.getByTestId('balance-hero'));
}

async function heroBalance(): Promise<string> {
  await screen.findByText(fr.home.balanceLabel);
  return String(hero().getAllByText(/[0-9٠-٩]/)[0].props.children).replace(/‎/g, '');
}

const prevChevron = () => screen.getByLabelText(fr.a11y.previousMonth);
const nextChevron = () => screen.getByLabelText(fr.a11y.nextMonth);

describe('month selector (US-008)', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    I18nManager.isRTL = originalIsRTL;
    await i18n.changeLanguage('fr');
  });

  it('opens on the current month, named in the active language', async () => {
    await seed();
    await renderHome();

    expect(await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'))).toBeTruthy();
  });

  it('names the month in Arabic when Arabic is active', async () => {
    await seed();
    await i18n.changeLanguage('ar');
    await renderHome();

    expect(await screen.findByText(formatMonthLabel(THIS_MONTH, 'ar'))).toBeTruthy();
  });

  describe('walking back a month', () => {
    it('re-scopes the balance', async () => {
      await seed();
      await addTransaction(THIS_MONTH, 10000, 'Ce mois');
      await addTransaction(LAST_MONTH, 70000, 'Mois dernier');
      await renderHome();
      expect(await heroBalance()).toBe('-100');

      await fireEvent.press(prevChevron());

      expect(await heroBalance()).toBe('-700');
    });

    /** The list used to show the latest transactions overall, so June listed July's. */
    it('re-scopes the transaction list', async () => {
      await seed();
      await addTransaction(THIS_MONTH, 10000, 'Ce mois');
      await addTransaction(LAST_MONTH, 70000, 'Mois dernier');
      await renderHome();
      expect(await screen.findByText('Ce mois')).toBeTruthy();

      await fireEvent.press(prevChevron());

      expect(await screen.findByText('Mois dernier')).toBeTruthy();
      expect(screen.queryByText('Ce mois')).toBeNull();
    });

    it('re-scopes the category breakdown', async () => {
      await seed();
      await addTransaction(LAST_MONTH, 70000, 'Mois dernier');
      await renderHome();
      // Nothing this month: the ring shows its empty state.
      expect(await screen.findByText(fr.home.breakdownEmpty)).toBeTruthy();

      await fireEvent.press(prevChevron());

      expect(screen.queryByText(fr.home.breakdownEmpty)).toBeNull();
      expect(await screen.findByText(formatMonthLabel(LAST_MONTH, 'fr'))).toBeTruthy();
    });

    /**
     * A goal is cumulative, so a past month shows what had been saved *by the end of it* — not
     * that month's deposits alone, which would read as a goal that lost its progress.
     */
    it('shows a goal as it stood at the end of that month', async () => {
      await seed();
      const vault = await createVault(mockFakeDb, {
        name: 'Omra',
        targetMinor: 1000000,
        currencyCode: 'MAD',
      });
      await createVaultContribution(mockFakeDb, {
        vaultId: vault.id,
        amountMinor: 200000,
        memberId: member.id,
        date: `${LAST_MONTH}-10T10:00:00.000Z`,
      });
      await createVaultContribution(mockFakeDb, {
        vaultId: vault.id,
        amountMinor: 300000,
        memberId: member.id,
        date: `${THIS_MONTH}-10T10:00:00.000Z`,
      });
      await renderHome();
      // This month: both deposits count — 5 000 saved.
      expect(await screen.findByText(/5\.000.*\/.*10\.000.*MAD/)).toBeTruthy();

      await fireEvent.press(prevChevron());

      // Last month: only what was in the vault by then.
      expect(await screen.findByText(/2\.000.*\/.*10\.000.*MAD/)).toBeTruthy();
    });
  });

  describe('the current month is the ceiling', () => {
    it('disables the next chevron on the current month', async () => {
      await seed();
      await renderHome();
      await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'));

      expect(nextChevron()).toBeDisabled();
      expect(prevChevron()).toBeEnabled();
    });

    it('goes nowhere when the next chevron is pressed anyway', async () => {
      await seed();
      await renderHome();
      await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'));

      await fireEvent.press(nextChevron());

      expect(screen.getByText(formatMonthLabel(THIS_MONTH, 'fr'))).toBeTruthy();
    });

    it('re-enables the next chevron once in the past', async () => {
      await seed();
      await renderHome();
      await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'));

      await fireEvent.press(prevChevron());

      expect(nextChevron()).toBeEnabled();
      expect(await screen.findByText(formatMonthLabel(LAST_MONTH, 'fr'))).toBeTruthy();
    });

    it('comes back forward and stops at the current month', async () => {
      await seed();
      await renderHome();
      await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'));
      await fireEvent.press(prevChevron());

      await fireEvent.press(nextChevron());

      expect(await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'))).toBeTruthy();
      expect(nextChevron()).toBeDisabled();
    });
  });

  // The chevrons are directional glyphs, so they flip; the row mirrors around them.
  it.each([
    ['LTR', false],
    ['RTL', true],
  ])('keeps both chevrons reachable in %s', async (_name, isRTL) => {
    I18nManager.isRTL = isRTL;
    await seed();
    await renderHome();
    await screen.findByText(formatMonthLabel(THIS_MONTH, 'fr'));

    expect(prevChevron()).toBeTruthy();
    expect(nextChevron()).toBeTruthy();
  });

  it('names the chevrons in Arabic', async () => {
    await seed();
    await i18n.changeLanguage('ar');
    await renderHome();
    await screen.findByText(formatMonthLabel(THIS_MONTH, 'ar'));

    expect(screen.getByLabelText(ar.a11y.previousMonth)).toBeTruthy();
    expect(screen.getByLabelText(ar.a11y.nextMonth)).toBeTruthy();
  });
});
