import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  createCategory,
  createMember,
  createTransaction,
  listTransactions,
  setBudgetAlertsEnabled,
  updateCategoryBudget,
  upsertCategoryBudget,
} from '../../db/repositories';
import type { Transaction } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { notificationClient } from '../../notifications';
import { ThemeProvider } from '../../theme';
import { AddExpenseForm } from '../AddExpenseForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

jest.mock('../../notifications', () => {
  const actual = jest.requireActual('../../notifications');
  return { ...actual, notificationClient: { presentNow: jest.fn() } };
});

function renderForm(onSaved: () => void = jest.fn(), onCancel: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <AddExpenseForm onSaved={onSaved} onCancel={onCancel} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

function renderEditForm(
  transaction: Transaction,
  onSaved: () => void = jest.fn(),
  onCancel: () => void = jest.fn(),
  onDeleted: () => void = jest.fn(),
) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <AddExpenseForm
          transaction={transaction}
          onSaved={onSaved}
          onCancel={onCancel}
          onDeleted={onDeleted}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('AddExpenseForm', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
  });

  /**
   * US-016 asks for Save to be *disabled* at zero rather than to error after the press: the answer
   * to "can I save this?" is known before the user asks, so asking is the wrong moment to say no.
   */
  it('disables Enregistrer until the amount is usable', async () => {
    await renderForm();
    await screen.findByText('Courses');

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '0');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('saves nothing while the amount is unusable', async () => {
    await renderForm();
    await screen.findByText('Courses');

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });

  it('saves a valid expense (default type) and calls onSaved', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.press(screen.getByText('Moi'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42.50');

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const saved = await listTransactions(mockFakeDb);
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe('expense');
    expect(saved[0].amountMinor).toBe(4250);
    expect(saved[0].currencyCode).toBe('MAD');
  });

  it('saves an income when the Revenu type chip is selected (US-011)', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Revenu'));
    expect(await screen.findByText('Nouveau revenu')).toBeTruthy();

    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.press(screen.getByText('Moi'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '5000');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const saved = await listTransactions(mockFakeDb);
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe('income');
  });

  it('calls onCancel without saving anything', async () => {
    const onCancel = jest.fn();
    await renderForm(jest.fn(), onCancel);

    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Annuler'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });
});

describe('AddExpenseForm — chips de catégories (US-017)', () => {
  /** Creates `count` uses of `categoryId`, all inside the 30-day window. */
  async function useCategory(categoryId: string, memberId: string, count: number) {
    for (let index = 0; index < count; index += 1) {
      await createTransaction(mockFakeDb, {
        type: 'expense',
        amountMinor: 1000,
        currencyCode: 'MAD',
        categoryId,
        memberId,
        occurredAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  /**
   * `orderIndex` is set explicitly: left to its `0` default, `listCategories` falls back to
   * `name ASC` and the default order becomes alphabetical, which is not what these tests mean by
   * "the 7th category".
   */
  async function seedCategories(names: string[]) {
    const created = [];
    for (const [orderIndex, name] of names.entries()) {
      created.push(
        await createCategory(mockFakeDb, { name, icon: 'cart', color: '#111111', orderIndex }),
      );
    }
    return created;
  }

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  /** The category chips in the order they are actually rendered, read off the tree. */
  function renderedCategoryOrder(names: string[]): string[] {
    return screen
      .getAllByRole('button')
      .map((node) => node.props.accessibilityLabel)
      .filter((label: string | undefined): label is string => names.includes(label ?? ''));
  }

  it('orders the chips by 30-day usage, most-used first', async () => {
    const [courses, ecole, transport] = await seedCategories(['Courses', 'École', 'Transport']);
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    // Least-used first in the DB, so passing can only come from the ranking, not from insertion
    // order leaking through.
    await useCategory(courses.id, member.id, 1);
    await useCategory(ecole.id, member.id, 2);
    await useCategory(transport.id, member.id, 3);

    await renderForm();
    await screen.findByText('Transport');

    expect(renderedCategoryOrder(['Courses', 'École', 'Transport'])).toEqual([
      'Transport',
      'École',
      'Courses',
    ]);
  });

  it('leaves usage older than 30 days out of the ranking', async () => {
    const [courses, ecole] = await seedCategories(['Courses', 'École']);
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: ecole.id,
      memberId: member.id,
      occurredAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await useCategory(courses.id, member.id, 1);

    await renderForm();
    await screen.findByText('Courses');

    expect(renderedCategoryOrder(['Courses', 'École'])).toEqual(['Courses', 'École']);
  });

  it('selects a chip and replaces the previous selection', async () => {
    await seedCategories(['Courses', 'École']);
    await createMember(mockFakeDb, { name: 'Moi' });

    await renderForm();
    await screen.findByText('Courses');

    // The first category is selected by default; picking another must not leave both selected.
    await fireEvent.press(screen.getByText('École'));

    expect(screen.getByLabelText('École').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Courses').props.accessibilityState.selected).toBe(false);
  });

  it('hides "Plus" while the strip already shows every category', async () => {
    await seedCategories(['Courses', 'École']);
    await createMember(mockFakeDb, { name: 'Moi' });

    await renderForm();
    await screen.findByText('Courses');

    expect(screen.queryByText('Plus')).toBeNull();
  });

  it('opens the complete list through "Plus" when categories overflow the strip', async () => {
    await seedCategories([
      'Courses',
      'École',
      'Transport',
      'Santé',
      'Factures',
      'Logement',
      'Loisirs',
    ]);
    await createMember(mockFakeDb, { name: 'Moi' });

    await renderForm();
    await screen.findByText('Courses');

    // The 7th category is beyond the strip's 6 quick chips, so it is not offered yet.
    expect(screen.queryByText('Loisirs')).toBeNull();

    await fireEvent.press(screen.getByText('Plus'));

    expect(await screen.findByText('Loisirs')).toBeTruthy();
  });

  it('keeps a category picked from the complete list visible on the strip', async () => {
    await seedCategories([
      'Courses',
      'École',
      'Transport',
      'Santé',
      'Factures',
      'Logement',
      'Loisirs',
    ]);
    await createMember(mockFakeDb, { name: 'Moi' });

    await renderForm();
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Plus'));
    await fireEvent.press(await screen.findByText('Loisirs'));

    expect(screen.getByLabelText('Loisirs').props.accessibilityState.selected).toBe(true);
  });
});

describe('AddExpenseForm — édition (US-016)', () => {
  let category: Awaited<ReturnType<typeof createCategory>>;
  let member: Awaited<ReturnType<typeof createMember>>;
  let existing: Transaction;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    member = await createMember(mockFakeDb, { name: 'Moi' });
    existing = await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 4250,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-01-15T10:00:00.000Z',
      note: 'Courses de la semaine',
    });
  });

  it('pre-fills the form with the existing transaction', async () => {
    await renderEditForm(existing);

    expect(await screen.findByText('Modifier la dépense')).toBeTruthy();
    expect(screen.getByLabelText('Montant (MAD)').props.value).toBe('42.5');
    expect(screen.getByLabelText('Date').props.value).toBe('2026-01-15');
    expect(screen.getByLabelText('Note (optionnel)').props.value).toBe('Courses de la semaine');
  });

  it('updates the transaction in place (no duplicate) and updates aggregates', async () => {
    const onSaved = jest.fn();
    await renderEditForm(existing, onSaved);

    await screen.findByText('Modifier la dépense');
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '100');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listTransactions(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(existing.id);
    expect(all[0].amountMinor).toBe(10000);
  });

  it('does not delete without confirmation (pas de perte de données silencieuse)', async () => {
    const onDeleted = jest.fn();
    await renderEditForm(existing, jest.fn(), jest.fn(), onDeleted);

    await screen.findByText('Modifier la dépense');
    await fireEvent.press(screen.getByText('Supprimer'));

    // A confirmation step appears instead of deleting immediately.
    expect(await screen.findByText('Supprimer définitivement cette opération ?')).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(await listTransactions(mockFakeDb)).toHaveLength(1);

    // Cancelling the confirmation leaves the transaction untouched.
    await fireEvent.press(screen.getByText('Ne pas supprimer'));
    expect(screen.queryByText('Supprimer définitivement cette opération ?')).toBeNull();
    expect(await listTransactions(mockFakeDb)).toHaveLength(1);
  });

  it('deletes the transaction once the deletion is confirmed', async () => {
    const onDeleted = jest.fn();
    await renderEditForm(existing, jest.fn(), jest.fn(), onDeleted);

    await screen.findByText('Modifier la dépense');
    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(await screen.findByText('Oui, supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });
});

describe('AddExpenseForm — alertes de plafond (US-019)', () => {
  let category: Awaited<ReturnType<typeof createCategory>>;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    await createMember(mockFakeDb, { name: 'Moi' });
    jest.mocked(notificationClient.presentNow).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function saveNinetyDirhamExpense(onSaved: () => void) {
    await renderForm(onSaved);
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.press(screen.getByText('Moi'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '90');
    await fireEvent.press(screen.getByText('Enregistrer'));
  }

  it('does not notify when budget alerts are opted out (default)', async () => {
    await upsertCategoryBudget(mockFakeDb, category.id, {
      month: new Date().toISOString().slice(0, 7),
      capMinor: 10000,
      alertThresholdMinor: 8000,
    });
    const onSaved = jest.fn();

    await saveNinetyDirhamExpense(onSaved);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('sends a budget alert once the threshold is reached, when opted in and outside quiet hours', async () => {
    jest.useFakeTimers({ now: new Date(2026, 0, 1, 14, 0) });
    await setBudgetAlertsEnabled(mockFakeDb, true);
    await upsertCategoryBudget(mockFakeDb, category.id, {
      month: new Date().toISOString().slice(0, 7),
      capMinor: 10000,
      alertThresholdMinor: 8000,
    });
    const onSaved = jest.fn();

    await saveNinetyDirhamExpense(onSaved);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
    expect(notificationClient.presentNow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Alerte de plafond' }),
    );
  });

  it('respects quiet hours even when opted in and over the threshold', async () => {
    jest.useFakeTimers({ now: new Date(2026, 0, 1, 23, 0) });
    await setBudgetAlertsEnabled(mockFakeDb, true);
    await upsertCategoryBudget(mockFakeDb, category.id, {
      month: new Date().toISOString().slice(0, 7),
      capMinor: 10000,
      alertThresholdMinor: 8000,
    });
    const onSaved = jest.fn();

    await saveNinetyDirhamExpense(onSaved);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not send a second alert for the same month once already notified (no spam)', async () => {
    jest.useFakeTimers({ now: new Date(2026, 0, 1, 14, 0) });
    await setBudgetAlertsEnabled(mockFakeDb, true);
    const monthKey = new Date().toISOString().slice(0, 7);
    const budget = await upsertCategoryBudget(mockFakeDb, category.id, {
      month: monthKey,
      capMinor: 10000,
      alertThresholdMinor: 8000,
    });
    await updateCategoryBudget(mockFakeDb, budget.id, { lastAlertedMonth: monthKey });
    const onSaved = jest.fn();

    await saveNinetyDirhamExpense(onSaved);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });
});
