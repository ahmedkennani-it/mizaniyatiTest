import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { listDebts } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { DebtForm } from '../DebtForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(onSaved: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <DebtForm currencyCode="MAD" onSaved={onSaved} onCancel={jest.fn()} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('DebtForm — ajout (US-049)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('defaults to "On me doit" and records the direction, person, amount and date', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await fireEvent.changeText(screen.getByLabelText('Personne'), 'Karim');
    await fireEvent.changeText(screen.getByLabelText('Montant'), '500');
    await fireEvent.changeText(screen.getByLabelText('Date du prêt'), '2026-06-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listDebts(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      counterparty: 'Karim',
      direction: 'owed_to_household',
      amountMinor: 50000,
      date: '2026-06-01',
      dueDate: null,
    });
  });

  it('records "Je dois" when that direction is chosen', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Je dois'));
    await fireEvent.changeText(screen.getByLabelText('Personne'), 'Épicerie du coin');
    await fireEvent.changeText(screen.getByLabelText('Montant'), '120');
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listDebts(mockFakeDb);
    expect(all[0].direction).toBe('household_owes');
  });

  it('records an optional due date', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Personne'), 'Salma');
    await fireEvent.changeText(screen.getByLabelText('Montant'), '500');
    await fireEvent.changeText(screen.getByLabelText('Échéance (optionnel)'), '2026-09-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listDebts(mockFakeDb);
    expect(all[0].dueDate).toBe('2026-09-01');
  });

  it('shows a validation error and does not create when the person is empty', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Montant'), '500');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un nom.')).toBeTruthy();
    expect(await listDebts(mockFakeDb)).toHaveLength(0);
  });

  it('shows a validation error and does not create with an invalid amount', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Personne'), 'Karim');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un montant valide, supérieur à zéro.')).toBeTruthy();
    expect(await listDebts(mockFakeDb)).toHaveLength(0);
  });

  it('rejects an invalid due date', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Personne'), 'Karim');
    await fireEvent.changeText(screen.getByLabelText('Montant'), '500');
    await fireEvent.changeText(screen.getByLabelText('Échéance (optionnel)'), 'pas-une-date');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez une échéance valide (AAAA-MM-JJ).')).toBeTruthy();
    expect(await listDebts(mockFakeDb)).toHaveLength(0);
  });

  it('never offers or computes an interest rate', () => {
    renderForm();

    expect(screen.queryByText(/intérêt/i)).toBeNull();
    expect(screen.queryByText(/taux/i)).toBeNull();
  });
});
