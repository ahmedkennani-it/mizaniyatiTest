import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;
const mockNavigate = jest.fn();

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { createCategory, createHousehold, createMember, createTransaction } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import type { Member } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { monthKeyOf } from '../../i18n/dateFormat';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { HomeScreen } from '../HomeScreen';

const THIS_MONTH = monthKeyOf(new Date());

let member: Member;

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  member = await createMember(mockFakeDb, { name: 'Youssef' });
}

/**
 * One expense in its own category, so each name maps to exactly one slice. The note matters: a
 * transaction row falls back to its category's name when it has none, which would make the name
 * appear both in the legend and in the list below.
 */
async function spend(categoryName: string, amountMinor: number) {
  const category = await createCategory(mockFakeDb, {
    name: categoryName,
    icon: 'cart',
    color: '#0D9488',
  });
  await createTransaction(mockFakeDb, {
    type: 'expense',
    amountMinor,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: member.id,
    occurredAt: `${THIS_MONTH}-05T10:00:00.000Z`,
    note: `Dépense ${categoryName}`,
  });
}

async function renderHome() {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <ExpenseEntryProvider>
            <HomeScreen navigation={{ navigate: mockNavigate } as never} />
          </ExpenseEntryProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

/** The breakdown card, so the hero's own figures don't answer these queries. */
function breakdown() {
  return within(screen.getByTestId('category-breakdown'));
}

/** Figures are wrapped in invisible LTR marks, so an exact-string match never hits. */
function expectFigure(value: string) {
  expect(breakdown().getByText(new RegExp(`^\u200E?${value.replace('.', '\\.')}\u200E?$`))).toBeTruthy();
}

describe('category breakdown ring (US-010)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
    mockNavigate.mockClear();
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('shows each category with the month total in the middle', async () => {
    await seed();
    await spend('Courses', 60000);
    await spend('Transport', 40000);
    await renderHome();

    expect(await screen.findByText('Courses')).toBeTruthy();
    expect(screen.getByText('Transport')).toBeTruthy();
    expect(screen.getByText(fr.home.spentLabel)).toBeTruthy();
    // 600 + 400 = 1000 spent, in the middle of the ring.
    expectFigure('1.000');
  });

  it('shows the empty state when nothing was spent', async () => {
    await seed();
    await renderHome();

    expect(await screen.findByText(fr.home.breakdownEmpty)).toBeTruthy();
  });

  describe('more than four categories', () => {
    // Amounts chosen so the aggregate total collides with none of the individual ones.
    async function spendOnSix() {
      await seed();
      await spend('Courses', 60000);
      await spend('Transport', 50000);
      await spend('École', 40000);
      await spend('Santé', 30000);
      await spend('Loisirs', 20000);
      await spend('Factures', 15000);
    }

    it('lists the top four and aggregates the rest into Autres', async () => {
      await spendOnSix();
      await renderHome();

      await screen.findByText('Courses');
      for (const name of ['Courses', 'Transport', 'École', 'Santé']) {
        expect(breakdown().getByText(name)).toBeTruthy();
      }
      expect(breakdown().getByText(fr.home.breakdownOthers)).toBeTruthy();
      expect(breakdown().queryByText('Loisirs')).toBeNull();
      expect(breakdown().queryByText('Factures')).toBeNull();
    });

    /** The slices must still add up to the figure in the middle. */
    it('sums the tail into Autres rather than dropping it', async () => {
      await spendOnSix();
      await renderHome();

      await screen.findByText('Courses');
      // 200 + 150 = 350 folded into "Autres"; total in the middle is 2 150.
      expectFigure('350');
      expectFigure('2.150');
    });

    it('names Autres in the active language', async () => {
      await spendOnSix();
      await i18n.changeLanguage('ar');
      await renderHome();

      expect(await screen.findByText('أخرى')).toBeTruthy();
    });
  });

  describe('opening a category', () => {
    it('opens the category detail when a legend row is tapped', async () => {
      await seed();
      await spend('Courses', 60000);
      await renderHome();

      await fireEvent.press(await screen.findByRole('button', { name: 'Courses' }));

      expect(mockNavigate).toHaveBeenCalledWith('categories');
    });

    // "Autres" stands for several categories, so there is no single detail to open.
    it('leaves the Autres row inert', async () => {
      await seed();
      for (const [name, amount] of [
        ['Courses', 60000],
        ['Transport', 50000],
        ['École', 40000],
        ['Santé', 30000],
        ['Loisirs', 20000],
      ] as const) {
        await spend(name, amount);
      }
      await renderHome();
      await screen.findByText(fr.home.breakdownOthers);

      expect(screen.queryByRole('button', { name: fr.home.breakdownOthers })).toBeNull();
    });

    it('gives the legend rows a full-size touch target', async () => {
      await seed();
      await spend('Courses', 60000);
      await renderHome();

      const row = await screen.findByRole('button', { name: 'Courses' });
      expect(row.props.style.minHeight).toBe(44);
    });
  });
});
