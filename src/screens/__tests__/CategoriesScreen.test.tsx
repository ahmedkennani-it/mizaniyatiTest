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
  createMember,
  createTransaction,
  upsertCategoryBudget,
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
import { CategoriesScreen } from '../CategoriesScreen';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';

const TWO_CATEGORY_PLAN: Plan = {
  id: 'two-category-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'categories.max', type: 'limit', numericValue: 2 }],
};

function renderScreen(plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <SubscriptionProvider>
            <ExpenseEntryProvider>
              <CategoriesScreen />
            </ExpenseEntryProvider>
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('CategoriesScreen', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('lists existing categories and opens the detail, then the edit form (US-025/US-027)', async () => {
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });
    await renderScreen();

    await fireEvent.press(await screen.findByText('Courses'));
    expect(await screen.findByText('Aucun plafond défini pour cette catégorie ce mois-ci.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Modifier le plafond'));

    expect(await screen.findByText('Modifier la catégorie')).toBeTruthy();
    expect(screen.getByLabelText('Nom').props.value).toBe('Courses');
  });

  it('creates a new category from the list view', async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText('Ajouter une catégorie'));
    expect(await screen.findByText('Nouvelle catégorie')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Zakat');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Zakat')).toBeTruthy();
  });

  it('blocks creation and shows the upsell once the plan limit is reached (US-017)', async () => {
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });
    await createCategory(mockFakeDb, { name: 'Transport', icon: 'car', color: '#3457D5' });

    await renderScreen(TWO_CATEGORY_PLAN);

    expect(
      await screen.findByText('Limite de catégories atteinte (2) pour votre plan.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Passez à un forfait supérieur pour créer plus de catégories.'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Ajouter une catégorie'));
    // The limit blocked navigation to the create form — the Pro paywall opens instead (US-031).
    expect(screen.queryByText('Nouvelle catégorie')).toBeNull();
    expect(await screen.findByText('Mizaniyati Pro')).toBeTruthy();
  });

  it('does not show the upsell when under the plan limit', async () => {
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });

    await renderScreen(TWO_CATEGORY_PLAN);

    await screen.findByText('Courses');
    expect(screen.queryByText(/Limite de catégories atteinte/)).toBeNull();
  });

  describe("plafonds & seuils d'alerte (US-018)", () => {
    function currentMonthKey(): string {
      return new Date().toISOString().slice(0, 7);
    }

    it('shows the percentage of the cap consumed while under budget', async () => {
      const courses = await createCategory(mockFakeDb, {
        name: 'Courses',
        icon: 'cart',
        color: '#1E7B34',
      });
      const member = await createMember(mockFakeDb, { name: 'Moi' });
      await createTransaction(mockFakeDb, {
        type: 'expense',
        amountMinor: 45000,
        currencyCode: 'MAD',
        categoryId: courses.id,
        memberId: member.id,
        occurredAt: new Date().toISOString(),
      });
      await upsertCategoryBudget(mockFakeDb, courses.id, {
        month: currentMonthKey(),
        capMinor: 100000,
        alertThresholdMinor: 80000,
      });

      await renderScreen();

      // The budget row shows the % consumed as a compact tag and the spent / cap amount
      // (450 spent against a 1 000 MAD cap).
      expect(await screen.findByText('45%')).toBeTruthy();
      expect(screen.getByText(/450/)).toBeTruthy();
    });

    it('marks a category "dépassé de X" once spending exceeds its cap', async () => {
      const courses = await createCategory(mockFakeDb, {
        name: 'Courses',
        icon: 'cart',
        color: '#1E7B34',
      });
      const member = await createMember(mockFakeDb, { name: 'Moi' });
      await createTransaction(mockFakeDb, {
        type: 'expense',
        amountMinor: 130000,
        currencyCode: 'MAD',
        categoryId: courses.id,
        memberId: member.id,
        occurredAt: new Date().toISOString(),
      });
      await upsertCategoryBudget(mockFakeDb, courses.id, {
        month: currentMonthKey(),
        capMinor: 100000,
        alertThresholdMinor: 80000,
      });

      await renderScreen();

      // Over-budget surfaces as the top alert banner (and a red row) rather than an inline label.
      expect(await screen.findByText(/dépassé son plafond/)).toBeTruthy();
    });

    it('shows no badge for a category without a configured budget', async () => {
      await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });

      await renderScreen();

      await screen.findByText('Courses');
      expect(screen.queryByText(/du plafond/)).toBeNull();
      expect(screen.queryByText(/Dépassé de/)).toBeNull();
    });
  });

  describe('retraduction des catégories par défaut (US-056)', () => {
    afterEach(async () => {
      await i18n.changeLanguage('fr');
    });

    it('shows a pristine default category translated into the active language', async () => {
      await createCategory(mockFakeDb, {
        name: 'Courses',
        icon: 'cart',
        color: '#D97706',
        isDefault: true,
      });
      await i18n.changeLanguage('en');

      await renderScreen();

      expect(await screen.findByText('Groceries')).toBeTruthy();
      expect(screen.queryByText('Courses')).toBeNull();
    });

    it('keeps a renamed default category exactly as the household typed it, in every language', async () => {
      await createCategory(mockFakeDb, {
        name: 'Épicerie du coin',
        icon: 'cart',
        color: '#D97706',
        isDefault: true,
      });
      await i18n.changeLanguage('en');

      await renderScreen();

      expect(await screen.findByText('Épicerie du coin')).toBeTruthy();
      expect(screen.queryByText('Groceries')).toBeNull();
    });

    it('never retranslates a fully custom (non-default) category', async () => {
      await createCategory(mockFakeDb, {
        name: 'Courses',
        icon: 'cart',
        color: '#D97706',
        isDefault: false,
      });
      await i18n.changeLanguage('en');

      await renderScreen();

      expect(await screen.findByText('Courses')).toBeTruthy();
      expect(screen.queryByText('Groceries')).toBeNull();
    });
  });
});
