import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  createCategory,
  createMember,
  createTransaction,
  listCategories,
  listMembers,
  listRecurringRules,
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
import type { AddExpenseFormPrefill } from '../AddExpenseForm';

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

function renderPrefillForm(prefill: AddExpenseFormPrefill, onSaved: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <AddExpenseForm prefill={prefill} onSaved={onSaved} onCancel={jest.fn()} />
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
    // A single-member household never shows a member chip to press (US-018) — it's already
    // auto-assigned.
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
    // US-024: the caller gets the deleted transaction back, so it can offer to restore it.
    expect(onDeleted).toHaveBeenCalledWith(expect.objectContaining({ id: existing.id }));
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

/** US-021a: a voice dictation hands the household off to this form with what it understood. */
describe('AddExpenseForm — pré-remplissage depuis la dictée vocale (US-021a)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
  });

  it('pre-fills the amount and the note when both were understood', async () => {
    renderPrefillForm({ amountInput: '42', note: 'Quarante-deux dirhams de café' });

    expect((await screen.findByLabelText('Montant (MAD)')).props.value).toBe('42');
    expect(screen.getByLabelText('Note (optionnel)').props.value).toBe('Quarante-deux dirhams de café');
  });

  it('pre-fills only the note when no amount was detected', async () => {
    renderPrefillForm({ note: 'Café et croissant' });

    expect((await screen.findByLabelText('Note (optionnel)')).props.value).toBe('Café et croissant');
    expect(screen.getByLabelText('Montant (MAD)').props.value).toBe('');
  });

  it('leaves the form blank when nothing was captured', async () => {
    renderPrefillForm({});

    expect((await screen.findByLabelText('Montant (MAD)')).props.value).toBe('');
    expect(screen.getByLabelText('Note (optionnel)').props.value).toBe('');
  });

  it('still lets the household save the pre-filled amount as-is', async () => {
    const onSaved = jest.fn();
    renderPrefillForm({ amountInput: '42', note: 'Quarante-deux dirhams de café' }, onSaved);

    await fireEvent.press(await screen.findByText('Courses'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const [saved] = await listTransactions(mockFakeDb);
    expect(saved.amountMinor).toBe(4200);
    expect(saved.note).toBe('Quarante-deux dirhams de café');
  });
});

/** US-023: recording income, and optionally turning it into a monthly recurring proposal. */
describe('AddExpenseForm — revenu mensuel (US-023)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Salaire', icon: 'receipt', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
  });

  it('does not offer "rendre mensuel" for an expense', async () => {
    await renderForm();
    await screen.findByText('Salaire');

    expect(screen.queryByText('Rendre ce revenu mensuel')).toBeNull();
  });

  it('offers "rendre mensuel" once Revenu is selected, off by default', async () => {
    await renderForm();
    await screen.findByText('Salaire');

    await fireEvent.press(screen.getByText('Revenu'));

    const toggle = await screen.findByText('Rendre ce revenu mensuel');
    expect(toggle).toBeTruthy();
    expect(screen.queryByText(/proposé automatiquement/)).toBeNull();
  });

  it('saves a plain income with no recurring rule when left unchecked', async () => {
    await renderForm();
    await screen.findByText('Salaire');
    await fireEvent.press(screen.getByText('Revenu'));
    await fireEvent.press(screen.getByText('Salaire'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '5000');

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await listRecurringRules(mockFakeDb)).toHaveLength(0);
  });

  it('creates a recurring rule starting next month when checked', async () => {
    await renderForm();
    await screen.findByText('Salaire');
    await fireEvent.press(screen.getByText('Revenu'));
    await fireEvent.press(screen.getByText('Salaire'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '5000');
    await fireEvent.changeText(screen.getByLabelText('Date'), '2026-07-16');
    await fireEvent.press(await screen.findByText('Rendre ce revenu mensuel'));

    await fireEvent.press(screen.getByText('Enregistrer'));

    const [rule] = await listRecurringRules(mockFakeDb);
    expect(rule).toMatchObject({
      type: 'income',
      amountMinor: 500000,
      frequency: 'monthly',
      dayOfMonth: 16,
      startDate: '2026-08-01',
      mode: 'prompt',
    });
  });

  it('offers no "rendre mensuel" toggle while editing, and creates no rule on save', async () => {
    const [salaire] = await listCategories(mockFakeDb);
    const [moi] = await listMembers(mockFakeDb);
    const existing = await createTransaction(mockFakeDb, {
      type: 'income',
      amountMinor: 500000,
      currencyCode: 'MAD',
      categoryId: salaire.id,
      memberId: moi.id,
      occurredAt: '2026-07-16T10:00:00.000Z',
    });

    await renderEditForm(existing);
    await screen.findByText('Modifier le revenu');

    expect(screen.queryByText('Rendre ce revenu mensuel')).toBeNull();

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await listRecurringRules(mockFakeDb)).toHaveLength(0);
  });
});

/** US-018: attributing an operation to a household member. */
describe('AddExpenseForm — attribution à un membre (US-018)', () => {
  it('hides the member field entirely for a single-member household', async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });

    await renderForm();
    await screen.findByText('Courses');

    expect(screen.queryByText('Membre')).toBeNull();
    expect(screen.queryByText('Moi')).toBeNull();
  });

  it('still saves under the sole member even though the field is hidden', async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    const solo = await createMember(mockFakeDb, { name: 'Moi' });

    const onSaved = jest.fn();
    await renderForm(onSaved);
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const [saved] = await listTransactions(mockFakeDb);
    expect(saved.memberId).toBe(solo.id);
  });

  it('shows every household member as a choice, pre-selecting the first', async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Youssef' });
    await createMember(mockFakeDb, { name: 'Salma' });

    await renderForm();
    await screen.findByText('Courses');

    // `listMembers` orders alphabetically — "Salma" sorts before "Youssef" regardless of which
    // was created first, so it's the one pre-selected here.
    const salmaChip = await screen.findByLabelText('Salma');
    const youssefChip = screen.getByLabelText('Youssef');
    expect(salmaChip.props.accessibilityState.selected).toBe(true);
    expect(youssefChip.props.accessibilityState.selected).toBe(false);
  });

  it('lets the household switch the pre-selected member before saving', async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    // "Salma" sorts first and is pre-selected by default — switching to "Youssef" is what this
    // test actually exercises.
    const youssef = await createMember(mockFakeDb, { name: 'Youssef' });
    await createMember(mockFakeDb, { name: 'Salma' });

    const onSaved = jest.fn();
    await renderForm(onSaved);
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.press(await screen.findByLabelText('Youssef'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const [saved] = await listTransactions(mockFakeDb);
    expect(saved.memberId).toBe(youssef.id);
  });
});

/** US-019: choosing the operation's date. */
describe('AddExpenseForm — choix de la date (US-019)', () => {
  function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
  function todayIso(): string {
    return isoDate(new Date());
  }
  /** Day 1 of the calendar month before this one, built from local date parts directly — routing
   *  this through `Date`/`toISOString()` (UTC) can shift the day when the local offset is
   *  positive, same trap `calendarGrid.ts` avoids by working in UTC end-to-end instead of mixing. */
  function previousMonthIso(): string {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    return `${year}-${String(month).padStart(2, '0')}-01`;
  }
  function tomorrowIso(): string {
    return isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  }

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
  });

  it('defaults to today', async () => {
    await renderForm();
    await screen.findByText('Courses');

    expect(screen.getByLabelText('Date').props.value).toBe(todayIso());
  });

  it('opens a picker when the date field is focused', async () => {
    await renderForm();
    await screen.findByText('Courses');

    await fireEvent(screen.getByLabelText('Date'), 'focus');

    expect(await screen.findByLabelText(todayIso())).toBeTruthy();
  });

  it('sets the date and closes the picker once a day is tapped', async () => {
    await renderForm();
    await screen.findByText('Courses');
    await fireEvent(screen.getByLabelText('Date'), 'focus');
    const pastDay = previousMonthIso();
    // The picker opens on the current month — the target day only exists after navigating back.
    await fireEvent.press(await screen.findByLabelText('Mois précédent'));

    await fireEvent.press(await screen.findByLabelText(pastDay));

    expect(screen.getByLabelText('Date').props.value).toBe(pastDay);
    expect(screen.queryByLabelText(pastDay)).toBeNull();
  });

  it('shows a reminder when the chosen date falls in a previous month', async () => {
    await renderForm();
    await screen.findByText('Courses');
    await fireEvent(screen.getByLabelText('Date'), 'focus');
    await fireEvent.press(await screen.findByLabelText('Mois précédent'));

    await fireEvent.press(await screen.findByLabelText(previousMonthIso()));

    expect(await screen.findByText(/sera comptée dans/)).toBeTruthy();
  });

  it('shows no reminder for today’s date', async () => {
    await renderForm();
    await screen.findByText('Courses');

    expect(screen.queryByText(/sera comptée dans/)).toBeNull();
  });

  it('rejects a future date typed by hand instead of picked', async () => {
    await renderForm();
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42');
    await fireEvent.changeText(screen.getByLabelText('Date'), tomorrowIso());

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('La date ne peut pas être dans le futur.')).toBeTruthy();
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });

  it('counts a past-month operation in that month once saved', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);
    await screen.findByText('Courses');
    await fireEvent.press(screen.getByText('Courses'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '42');
    const pastDay = previousMonthIso();
    await fireEvent.changeText(screen.getByLabelText('Date'), pastDay);

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const [saved] = await listTransactions(mockFakeDb);
    expect(saved.occurredAt.slice(0, 10)).toBe(pastDay);
  });
});
