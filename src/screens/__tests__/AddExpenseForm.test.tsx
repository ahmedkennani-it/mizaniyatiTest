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

  it('shows validation errors and does not save when the amount is invalid', async () => {
    await renderForm();

    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText(/Saisissez un montant valide/)).toBeTruthy();
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });

  it('saves a valid expense (default type) and calls onSaved', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.press(screen.getByText('Moi'));
    await fireEvent.changeText(screen.getByLabelText('Montant'), '42.50');

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
    await fireEvent.changeText(screen.getByLabelText('Montant'), '5000');
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

describe('AddExpenseForm — édition (US-016)', () => {
  let category: Awaited<ReturnType<typeof createCategory>>;
  let member: Awaited<ReturnType<typeof createMember>>;
  let existing: Transaction;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    category = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
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
    expect(screen.getByLabelText('Montant').props.value).toBe('42.5');
    expect(screen.getByLabelText('Date').props.value).toBe('2026-01-15');
    expect(screen.getByLabelText('Note (optionnel)').props.value).toBe('Courses de la semaine');
  });

  it('updates the transaction in place (no duplicate) and updates aggregates', async () => {
    const onSaved = jest.fn();
    await renderEditForm(existing, onSaved);

    await screen.findByText('Modifier la dépense');
    await fireEvent.changeText(screen.getByLabelText('Montant'), '100');
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
    category = await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
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
    await fireEvent.changeText(screen.getByLabelText('Montant'), '90');
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
