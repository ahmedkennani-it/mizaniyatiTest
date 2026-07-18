import { render, screen } from '@testing-library/react-native';
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
import { EntitlementsProvider } from '../../entitlements';
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

const THIS_MONTH = monthKeyOf(new Date());

let category: Category;
let member: Member;

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  member = await createMember(mockFakeDb, { name: 'Youssef' });
  category = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  await createTransaction(mockFakeDb, {
    type: 'expense',
    amountMinor: 5000,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: member.id,
    occurredAt: `${THIS_MONTH}-05T10:00:00.000Z`,
    note: 'Pain',
  });
}

async function renderHome(seniorMode: boolean) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light" initialSeniorMode={seniorMode}>
          <EntitlementsProvider>
            <ExpenseEntryProvider>
              <HomeScreen />
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('senior-mode dashboard (US-060)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('keeps the greeting, month balance, income/expense and recent transactions', async () => {
    await seed();
    await renderHome(true);

    expect(await screen.findByText(fr.home.balanceIncome)).toBeTruthy();
    expect(screen.getByText(fr.home.balanceExpense)).toBeTruthy();
    expect(screen.getByText(fr.home.recentTitle)).toBeTruthy();
    expect(screen.getByText('Pain')).toBeTruthy();
  });

  it('hides the category ring', async () => {
    await seed();
    await renderHome(true);

    await screen.findByText(fr.home.recentTitle);
    expect(screen.queryByTestId('category-breakdown')).toBeNull();
    expect(screen.queryByText(fr.home.breakdownTitle)).toBeNull();
  });

  it('hides the trust chip and the goals section', async () => {
    await seed();
    await renderHome(true);

    await screen.findByText(fr.home.recentTitle);
    expect(screen.queryByText(fr.home.disclaimer)).toBeNull();
    expect(screen.queryByText(fr.home.goalsTitle)).toBeNull();
  });

  it('shows all of these again once senior mode is off', async () => {
    await seed();
    await renderHome(false);

    expect(await screen.findByTestId('category-breakdown')).toBeTruthy();
    expect(screen.getByText(fr.home.disclaimer)).toBeTruthy();
    expect(screen.getByText(fr.home.goalsTitle)).toBeTruthy();
  });
});
