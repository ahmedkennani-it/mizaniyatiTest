import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  createCategory,
  createMember,
  createTransaction,
  listCategories,
  listCategoryBudgets,
  listTransactions,
  upsertCategoryBudget,
} from '../../db/repositories';
import type { Category, CategoryBudget, Transaction } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { CategoryForm } from '../CategoryForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderNewForm(onSaved: () => void = jest.fn(), onCancel: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <CategoryForm
          otherCategories={[]}
          transactionsToReassign={[]}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('CategoryForm — création', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows a validation error and does not create when the name is empty', async () => {
    await renderNewForm();

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un nom de catégorie.')).toBeTruthy();
    expect(await listCategories(mockFakeDb)).toHaveLength(0);
  });

  it('creates a category with the chosen name/icon/color and calls onSaved', async () => {
    const onSaved = jest.fn();
    await renderNewForm(onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Zakat');
    await fireEvent.press(screen.getByText('school'));
    await fireEvent.press(screen.getByLabelText('#2563EB'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listCategories(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ name: 'Zakat', icon: 'school', color: '#2563EB' });
  });

  it('calls onCancel without creating anything', async () => {
    const onCancel = jest.fn();
    await renderNewForm(jest.fn(), onCancel);

    await fireEvent.press(screen.getByText('Annuler'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await listCategories(mockFakeDb)).toHaveLength(0);
  });
});

describe('CategoryForm — édition et suppression (US-017)', () => {
  let courses: Category;
  let autres: Category;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    courses = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });
    autres = await createCategory(mockFakeDb, {
      name: 'Autres',
      icon: 'ellipsis',
      color: '#54606B',
    });
  });

  it('pre-fills the form with the existing category', async () => {
    await render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            otherCategories={[autres]}
            transactionsToReassign={[]}
            onSaved={jest.fn()}
            onCancel={jest.fn()}
            onDeleted={jest.fn()}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );

    expect(await screen.findByText('Modifier la catégorie')).toBeTruthy();
    expect(screen.getByLabelText('Nom').props.value).toBe('Courses');
  });

  it('updates the category in place', async () => {
    const onSaved = jest.fn();
    await render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            otherCategories={[autres]}
            transactionsToReassign={[]}
            onSaved={onSaved}
            onCancel={jest.fn()}
            onDeleted={jest.fn()}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Courses & Épicerie');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listCategories(mockFakeDb);
    expect(all).toHaveLength(2);
    expect(all.find((c) => c.id === courses.id)?.name).toBe('Courses & Épicerie');
  });

  it('blocks deletion of the last remaining category', async () => {
    await render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            otherCategories={[]}
            transactionsToReassign={[]}
            onSaved={jest.fn()}
            onCancel={jest.fn()}
            onDeleted={jest.fn()}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );

    expect(await screen.findByText('Vous devez conserver au moins une catégorie.')).toBeTruthy();
    expect(screen.queryByText('Supprimer')).toBeNull();
  });

  it('deletes a category with no transactions after a simple confirm', async () => {
    const onDeleted = jest.fn();
    await render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            otherCategories={[autres]}
            transactionsToReassign={[]}
            onSaved={jest.fn()}
            onCancel={jest.fn()}
            onDeleted={onDeleted}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );

    await fireEvent.press(await screen.findByText('Supprimer'));
    expect(await screen.findByText('Supprimer définitivement cette catégorie ?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Oui, supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(await listCategories(mockFakeDb)).toHaveLength(1);
  });

  it('reassigns existing transactions to the chosen category before deleting (pas de perte de données)', async () => {
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const transaction = await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: courses.id,
      memberId: member.id,
      occurredAt: '2026-01-01T10:00:00.000Z',
    });
    const onDeleted = jest.fn();

    await render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            otherCategories={[autres]}
            transactionsToReassign={[transaction]}
            onSaved={jest.fn()}
            onCancel={jest.fn()}
            onDeleted={onDeleted}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );

    await fireEvent.press(await screen.findByText('Supprimer'));
    expect(await screen.findByText(/contient 1 opération/)).toBeTruthy();
    // "Autres" is pre-selected as the default reassignment target.
    await fireEvent.press(screen.getByText('Réaffecter et supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    const remainingCategories = await listCategories(mockFakeDb);
    expect(remainingCategories).toHaveLength(1);
    expect(remainingCategories[0].id).toBe(autres.id);
    const allTransactions = await listTransactions(mockFakeDb);
    expect(allTransactions).toHaveLength(1);
    expect(allTransactions[0].categoryId).toBe(autres.id);
  });
});

describe("CategoryForm — plafond & seuil d'alerte (US-018)", () => {
  let courses: Category;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    courses = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#1E7B34' });
  });

  function renderEditForm(
    budget?: CategoryBudget,
    onSaved: () => void = jest.fn(),
    transactionsToReassign: Transaction[] = [],
  ) {
    return render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <CategoryForm
            category={courses}
            budget={budget}
            otherCategories={[]}
            transactionsToReassign={transactionsToReassign}
            onSaved={onSaved}
            onCancel={jest.fn()}
            onDeleted={jest.fn()}
          />
        </ThemeProvider>
      </LanguageProvider>,
    );
  }

  it('does not create a budget when the cap/threshold fields are left blank', async () => {
    const onSaved = jest.fn();
    await renderEditForm(undefined, onSaved);

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(await listCategoryBudgets(mockFakeDb)).toHaveLength(0);
  });

  /** US-029: threshold is a percentage of the cap now, not a free-text amount — 80% by default. */
  it('creates a budget from the cap, with the alert threshold defaulting to 80% of it', async () => {
    const onSaved = jest.fn();
    await renderEditForm(undefined, onSaved);

    await fireEvent.changeText(screen.getByLabelText('Plafond'), '1000');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const budgets = await listCategoryBudgets(mockFakeDb);
    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({
      categoryId: courses.id,
      capMinor: 100000,
      alertThresholdMinor: 80000,
    });
  });

  /** US-029: percent chips top out at 100% by construction — the threshold can no longer exceed
   *  the cap the way a free-text amount could. */
  it('never exceeds the cap: selecting 100% sets the threshold equal to it', async () => {
    const onSaved = jest.fn();
    await renderEditForm(undefined, onSaved);

    await fireEvent.changeText(screen.getByLabelText('Plafond'), '1000');
    await fireEvent.press(screen.getByText('100%'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    const [saved] = await listCategoryBudgets(mockFakeDb);
    expect(saved).toMatchObject({ capMinor: 100000, alertThresholdMinor: 100000 });
  });

  it('previews the alert amount live as the cap or the threshold percent changes', async () => {
    await renderEditForm();

    await fireEvent.changeText(screen.getByLabelText('Plafond'), '1000');
    expect(await screen.findByText(/Notification quand tu atteins.*800,00 MAD/)).toBeTruthy();

    await fireEvent.press(screen.getByText('90%'));
    expect(await screen.findByText(/Notification quand tu atteins.*900,00 MAD/)).toBeTruthy();
  });

  it('pre-fills cap/threshold from an existing budget and updates it in place', async () => {
    const existingBudget = await upsertCategoryBudget(mockFakeDb, courses.id, {
      month: '2026-06',
      capMinor: 100000,
      alertThresholdMinor: 80000,
    });
    const onSaved = jest.fn();
    await renderEditForm(existingBudget, onSaved);

    expect(screen.getByLabelText('Plafond').props.value).toBe('1000');
    expect(screen.getByRole('button', { name: '80%' }).props.accessibilityState.selected).toBe(true);

    await fireEvent.changeText(screen.getByLabelText('Plafond'), '1200');
    await fireEvent.press(screen.getByText('90%'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const budgets = await listCategoryBudgets(mockFakeDb);
    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({
      id: existingBudget.id,
      capMinor: 120000,
      alertThresholdMinor: 108000,
    });
  });

  /** US-028: a cap set below what's already spent this month warns immediately, before saving. */
  it('warns immediately when the new cap is below what has already been spent this month', async () => {
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const transaction = await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 150000,
      currencyCode: 'MAD',
      categoryId: courses.id,
      memberId: member.id,
      occurredAt: new Date().toISOString(),
    });
    await renderEditForm(undefined, jest.fn(), [transaction]);

    await fireEvent.changeText(screen.getByLabelText('Plafond'), '1000');

    expect(
      await screen.findByText(/Attention.*avez déjà dépensé.*1.500,00 MAD.*ce mois-ci/),
    ).toBeTruthy();
  });

  it('offers the four quick cap presets, selecting the matching one in one tap', async () => {
    await renderEditForm();

    await fireEvent.press(screen.getByText('3000'));

    expect(screen.getByLabelText('Plafond').props.value).toBe('3000');
    expect(screen.getByRole('button', { name: '3000' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: '2500' }).props.accessibilityState.selected).toBe(false);
  });

  /** US-028: "éditable au clavier numérique" — the same custom keypad as the expense amount. */
  it('edits the cap through the numeric keypad', async () => {
    await renderEditForm();

    await fireEvent.press(screen.getByRole('button', { name: '3' }));
    await fireEvent.press(screen.getByRole('button', { name: '5' }));
    await fireEvent.press(screen.getByRole('button', { name: '0' }));
    await fireEvent.press(screen.getByRole('button', { name: '0' }));

    expect(screen.getByLabelText('Plafond').props.value).toBe('3500');
  });
});
