import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';
import {
  createCategory,
  createMember,
  createRecurringRule,
  listRecurringRules,
} from '../../db/repositories';
import type { Category, Member, RecurringRule } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { ThemeProvider } from '../../theme';
import { RecurringRuleForm } from '../RecurringRuleForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

let category: Category;
let member: Member;

function renderForm(
  rule?: RecurringRule,
  onSaved: () => void = jest.fn(),
  onDeleted: () => void = jest.fn(),
) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <RecurringRuleForm rule={rule} onSaved={onSaved} onCancel={jest.fn()} onDeleted={onDeleted} />
    </ThemeProvider>,
  );
}

describe('RecurringRuleForm — création (US-021)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    category = await createCategory(mockFakeDb, {
      name: 'Logement',
      icon: 'home',
      color: '#0D9488',
    });
    member = await createMember(mockFakeDb, { name: 'Youssef' });
  });

  it('creates a monthly rule with the chosen fields', async () => {
    const onSaved = jest.fn();
    await renderForm(undefined, onSaved);

    await fireEvent.changeText(screen.getByLabelText('Montant'), '1400');
    // `findBy*`: the category and member chips are loaded from the db after the first render.
    await fireEvent.press(await screen.findByText('Logement'));
    await fireEvent.press(screen.getByText('Youssef'));
    await fireEvent.changeText(screen.getByLabelText('Jour du mois'), '5');
    await fireEvent.changeText(screen.getByLabelText('Date de début'), '2026-08-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listRecurringRules(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 5,
      weekday: null,
      startDate: '2026-08-01',
      mode: 'prompt',
      paused: false,
    });
    expect(all[0].amountMinor).toBeGreaterThan(0);
  });

  it('creates a weekly rule with the chosen weekday', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Montant'), '50');
    await fireEvent.press(await screen.findByText('Logement'));
    await fireEvent.press(screen.getByText('Youssef'));
    await fireEvent.press(screen.getByText('Hebdomadaire'));
    await fireEvent.press(screen.getByText('Vendredi'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listRecurringRules(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ frequency: 'weekly', weekday: 5, dayOfMonth: null });
  });

  it('shows a validation error and does not create when the amount is empty', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un montant valide, supérieur à zéro.')).toBeTruthy();
    expect(await listRecurringRules(mockFakeDb)).toHaveLength(0);
  });

  it('rejects an end date that is not after the start date', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Montant'), '100');
    await fireEvent.changeText(screen.getByLabelText('Date de début'), '2026-08-01');
    await fireEvent.changeText(screen.getByLabelText('Date de fin (optionnel)'), '2026-07-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(
      await screen.findByText(
        'La date de fin doit être une date valide postérieure à la date de début.',
      ),
    ).toBeTruthy();
    expect(await listRecurringRules(mockFakeDb)).toHaveLength(0);
  });
});

describe('RecurringRuleForm — édition et suppression (US-021)', () => {
  let rule: RecurringRule;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    category = await createCategory(mockFakeDb, {
      name: 'Logement',
      icon: 'home',
      color: '#0D9488',
    });
    member = await createMember(mockFakeDb, { name: 'Youssef' });
    rule = await createRecurringRule(mockFakeDb, {
      type: 'expense',
      amountMinor: 100000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'prompt',
    });
  });

  it('pre-fills the form with the existing rule', async () => {
    await renderForm(rule);

    expect(screen.getByLabelText('Montant').props.value).toBe('1000');
    expect(screen.getByLabelText('Date de début').props.value).toBe('2026-07-01');
  });

  it('toggles pause before saving', async () => {
    const onSaved = jest.fn();
    await renderForm(rule, onSaved);

    await fireEvent.press(screen.getByText('Mettre en pause'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listRecurringRules(mockFakeDb);
    expect(all[0].paused).toBe(true);
  });

  it('deletes the rule after confirming', async () => {
    const onDeleted = jest.fn();
    await renderForm(rule, jest.fn(), onDeleted);

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(screen.getByText('Oui, supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(await listRecurringRules(mockFakeDb)).toHaveLength(0);
  });
});
