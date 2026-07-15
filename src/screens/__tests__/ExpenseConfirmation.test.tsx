import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { ExpenseConfirmation } from '../ExpenseConfirmation';

function renderConfirmation(
  remainingBalanceMinor: number,
  onAddAnother: () => void = jest.fn(),
  onDone: () => void = jest.fn(),
) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <ExpenseConfirmation
          remainingBalanceMinor={remainingBalanceMinor}
          currencyCode="MAD"
          onAddAnother={onAddAnother}
          onDone={onDone}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ExpenseConfirmation', () => {
  it('shows the recalculated remaining balance for the month', async () => {
    await renderConfirmation(123450);

    expect(screen.getByText('Opération enregistrée !')).toBeTruthy();
    expect(screen.getByText(/1.234,50/)).toBeTruthy();
  });

  it('still displays a negative balance clearly (no error thrown)', async () => {
    await renderConfirmation(-5000);

    expect(screen.getByText(/-50,00/)).toBeTruthy();
  });

  it('calls onAddAnother when pressing "Ajouter une autre"', async () => {
    const onAddAnother = jest.fn();
    await renderConfirmation(0, onAddAnother);

    await fireEvent.press(screen.getByText('Ajouter une autre'));

    expect(onAddAnother).toHaveBeenCalledTimes(1);
  });

  it('calls onDone when pressing "Retour à l\'accueil"', async () => {
    const onDone = jest.fn();
    await renderConfirmation(0, jest.fn(), onDone);

    await fireEvent.press(screen.getByText("Retour à l'accueil"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
