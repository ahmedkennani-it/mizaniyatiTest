import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { ExpenseConfirmation } from '../ExpenseConfirmation';
import type { ExpenseConfirmationOverBudget } from '../ExpenseConfirmation';

interface RenderOptions {
  remainingBalanceMinor?: number;
  amountMinor?: number;
  categoryName?: string;
  memberName?: string;
  occurredAt?: string;
  overBudget?: ExpenseConfirmationOverBudget;
  onAddAnother?: () => void;
  onDone?: () => void;
}

function renderConfirmation(options: RenderOptions = {}) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <ExpenseConfirmation
          remainingBalanceMinor={options.remainingBalanceMinor ?? 0}
          currencyCode="MAD"
          amountMinor={options.amountMinor ?? 4200}
          categoryName={options.categoryName ?? 'Restaurants'}
          memberName={options.memberName ?? 'Youssef'}
          occurredAt={options.occurredAt ?? '2026-07-16T10:00:00.000Z'}
          overBudget={options.overBudget}
          onAddAnother={options.onAddAnother ?? jest.fn()}
          onDone={options.onDone ?? jest.fn()}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ExpenseConfirmation', () => {
  it('shows the recalculated remaining balance for the month', async () => {
    await renderConfirmation({ remainingBalanceMinor: 123450 });

    expect(screen.getByText('Opération enregistrée !')).toBeTruthy();
    expect(screen.getByText(/1.234,50/)).toBeTruthy();
  });

  it('still displays a negative balance clearly (no error thrown)', async () => {
    await renderConfirmation({ remainingBalanceMinor: -5000 });

    expect(screen.getByText(/-50,00/)).toBeTruthy();
  });

  /** US-022: the just-saved operation's amount, category, member and date are shown. */
  it('shows the details of the operation that was just saved', async () => {
    await renderConfirmation({
      amountMinor: 4200,
      categoryName: 'Restaurants',
      memberName: 'Youssef',
      occurredAt: '2026-07-16T10:00:00.000Z',
    });

    expect(screen.getByText(/42,00 MAD/)).toBeTruthy();
    expect(screen.getByText('Restaurants')).toBeTruthy();
    expect(screen.getByText('Youssef')).toBeTruthy();
    expect(screen.getByText('16 juillet 2026')).toBeTruthy();
  });

  /** US-022: a cap crossed by this very operation is called out, not left to be found later. */
  it('warns when this operation pushed its category over its cap', async () => {
    await renderConfirmation({
      overBudget: { categoryName: 'Restaurants', overageMinor: 1500 },
    });

    expect(screen.getByText(/Restaurants a dépassé son plafond de.*15,00 MAD/)).toBeTruthy();
  });

  it('shows no warning when the operation stayed within the cap', async () => {
    await renderConfirmation({});

    expect(screen.queryByText(/a dépassé son plafond/)).toBeNull();
  });

  it('calls onAddAnother when pressing "Ajouter une autre"', async () => {
    const onAddAnother = jest.fn();
    await renderConfirmation({ onAddAnother });

    await fireEvent.press(screen.getByText('Ajouter une autre'));

    expect(onAddAnother).toHaveBeenCalledTimes(1);
  });

  it('calls onDone when pressing "Retour à l\'accueil"', async () => {
    const onDone = jest.fn();
    await renderConfirmation({ onDone });

    await fireEvent.press(screen.getByText("Retour à l'accueil"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
