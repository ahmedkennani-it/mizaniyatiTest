import { fireEvent, render, screen } from '@testing-library/react-native';
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
const OLD_MONTH = monthKeyOf(new Date(NOW.getFullYear() - 1, 0, 1));

let courses: Category;
let transport: Category;
let salma: Member;
let youssef: Member;

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  courses = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  transport = await createCategory(mockFakeDb, { name: 'Transport', icon: 'car', color: '#2563EB' });
  salma = await createMember(mockFakeDb, { name: 'Salma' });
  youssef = await createMember(mockFakeDb, { name: 'Youssef' });
}

async function add(
  note: string,
  type: 'expense' | 'income',
  category: Category,
  member: Member,
  monthKey = THIS_MONTH,
) {
  await createTransaction(mockFakeDb, {
    type,
    amountMinor: 10000,
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

/** Opens the history the way a user does: through the dashboard's "Voir tout". */
async function openHistory() {
  await renderHome();
  await fireEvent.press(await screen.findByText(fr.home.seeAll));
  await screen.findByText(fr.history.title);
}

describe('transaction history (US-012)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('opens from the dashboard’s "Voir tout"', async () => {
    await seed();
    await add('Pain', 'expense', courses, salma);

    await openHistory();

    expect(screen.getByText(fr.history.title)).toBeTruthy();
  });

  it('comes back to the dashboard', async () => {
    await seed();
    await add('Pain', 'expense', courses, salma);
    await openHistory();

    await fireEvent.press(screen.getByLabelText(fr.a11y.back));

    expect(await screen.findByText(fr.home.recentTitle)).toBeTruthy();
  });

  /** The dashboard hides other months; this list is the one place that shows everything. */
  it('shows every month, unlike the dashboard', async () => {
    await seed();
    await add('Ce mois', 'expense', courses, salma);
    await add('L’an dernier', 'expense', courses, salma, OLD_MONTH);
    await renderHome();

    expect(screen.queryByText('L’an dernier')).toBeNull();

    await fireEvent.press(await screen.findByText(fr.home.seeAll));

    expect(await screen.findByText('L’an dernier')).toBeTruthy();
    expect(screen.getByText('Ce mois')).toBeTruthy();
  });

  describe('filtering', () => {
    async function seedMixed() {
      await seed();
      await add('Pain', 'expense', courses, salma);
      await add('Bus', 'expense', transport, youssef);
      await add('Salaire', 'income', courses, youssef);
      await openHistory();
    }

    it('filters to expenses only', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText(fr.history.filterExpense));

      expect(screen.getByText('Pain')).toBeTruthy();
      expect(screen.getByText('Bus')).toBeTruthy();
      expect(screen.queryByText('Salaire')).toBeNull();
    });

    it('filters to income only', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText(fr.history.filterIncome));

      expect(screen.getByText('Salaire')).toBeTruthy();
      expect(screen.queryByText('Pain')).toBeNull();
    });

    it('filters by category', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText('Transport'));

      expect(screen.getByText('Bus')).toBeTruthy();
      expect(screen.queryByText('Pain')).toBeNull();
    });

    it('filters by member', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText('Salma'));

      expect(screen.getByText('Pain')).toBeTruthy();
      expect(screen.queryByText('Bus')).toBeNull();
    });

    it('combines a category and a member filter', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText('Courses'));
      await fireEvent.press(screen.getByText('Youssef'));

      expect(screen.getByText('Salaire')).toBeTruthy();
      expect(screen.queryByText('Pain')).toBeNull();
      expect(screen.queryByText('Bus')).toBeNull();
    });

    it('says so when nothing matches, rather than showing a blank list', async () => {
      await seedMixed();

      await fireEvent.press(screen.getByText(fr.history.filterIncome));
      await fireEvent.press(screen.getByText('Salma'));

      expect(screen.getByText(fr.history.empty)).toBeTruthy();
    });

    it('clears a filter through its "all" chip', async () => {
      await seedMixed();
      await fireEvent.press(screen.getByText('Transport'));
      expect(screen.queryByText('Pain')).toBeNull();

      await fireEvent.press(screen.getByText(fr.history.allCategories));

      expect(screen.getByText('Pain')).toBeTruthy();
    });
  });

  it('opens a transaction from the list', async () => {
    await seed();
    await add('Pain', 'expense', courses, salma);
    await openHistory();

    await fireEvent.press(screen.getByText('Pain'));

    expect(await screen.findByText(fr.expenseForm.titleEditExpense)).toBeTruthy();
  });
});
