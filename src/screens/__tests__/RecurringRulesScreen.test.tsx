import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  createCategory,
  createMember,
  createRecurringRule,
  listRecurringRules,
  listTransactions,
} from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { RecurringRulesScreen } from '../RecurringRulesScreen';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <RecurringRulesScreen onBack={onBack} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('RecurringRulesScreen (US-021)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the empty state when there are no rules', async () => {
    await renderScreen();

    expect(await screen.findByText('Aucune récurrence pour le moment.')).toBeTruthy();
  });

  it('lists an existing rule with its frequency and mode', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Logement',
      icon: 'home',
      color: '#0D9488',
    });
    const member = await createMember(mockFakeDb, { name: 'Youssef' });
    await createRecurringRule(mockFakeDb, {
      type: 'expense',
      amountMinor: 500000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'auto',
      note: 'Loyer',
    });

    await renderScreen();

    expect(await screen.findByText('Loyer')).toBeTruthy();
    expect(await screen.findByText(/Mensuel · jour 1/)).toBeTruthy();
    expect(await screen.findByText(/Automatique/)).toBeTruthy();
  });

  it('calls onBack when the back control is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    await fireEvent.press(screen.getByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opens the form to add a new rule', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Ajouter une récurrence'));

    expect(await screen.findByText('Nouvelle récurrence')).toBeTruthy();
  });
});

describe('RecurringRulesScreen — propositions (US-022)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  async function seedDuePromptRule() {
    const category = await createCategory(mockFakeDb, {
      name: 'Logement',
      icon: 'home',
      color: '#0D9488',
    });
    const member = await createMember(mockFakeDb, { name: 'Youssef' });
    // Exactly one occurrence due (the 1st of the current month) — a start date further in the
    // past would produce one proposal per missed month, breaking the single-match assertions below.
    const startOfThisMonth = `${new Date().toISOString().slice(0, 7)}-01`;
    const rule = await createRecurringRule(mockFakeDb, {
      type: 'expense',
      amountMinor: 100000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: startOfThisMonth,
      mode: 'prompt',
      note: 'Loyer',
    });
    return { category, member, rule };
  }

  it('shows a pending proposal for a due prompt-mode rule', async () => {
    await seedDuePromptRule();

    await renderScreen();

    expect(await screen.findByText('En attente de confirmation')).toBeTruthy();
    expect(screen.getByText('Confirmer')).toBeTruthy();
    expect(screen.getByText('Ignorer')).toBeTruthy();
  });

  it('confirms a proposal, creating a transaction and advancing lastRunDate', async () => {
    const { rule } = await seedDuePromptRule();
    await renderScreen();
    await screen.findByText('En attente de confirmation');

    await fireEvent.press(screen.getByText('Confirmer'));

    const transactions = await listTransactions(mockFakeDb);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ amountMinor: 100000, categoryId: rule.categoryId });
    const updatedRules = await listRecurringRules(mockFakeDb);
    expect(updatedRules[0].lastRunDate).not.toBeNull();
  });

  it('lets the user modify the amount before confirming (revenu irrégulier)', async () => {
    await seedDuePromptRule();
    await renderScreen();
    await screen.findByText('En attente de confirmation');

    await fireEvent.changeText(screen.getByLabelText('Montant'), '1500');
    await fireEvent.press(screen.getByText('Confirmer'));

    const transactions = await listTransactions(mockFakeDb);
    expect(transactions[0].amountMinor).toBe(150000);
  });

  it('ignores a proposal without creating a transaction', async () => {
    await seedDuePromptRule();
    await renderScreen();
    await screen.findByText('En attente de confirmation');

    await fireEvent.press(screen.getByText('Ignorer'));

    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
    const updatedRules = await listRecurringRules(mockFakeDb);
    expect(updatedRules[0].lastRunDate).not.toBeNull();
  });
});
