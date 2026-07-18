import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createDebt, createDebtRepayment, listDebtRepayments } from '../../db/repositories';
import type { Debt } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { DebtDetail } from '../DebtDetail';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

let debt: Debt;

function renderDetail(onBack: () => void = jest.fn(), onDebtChanged: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <DebtDetail debt={debt} onBack={onBack} onDebtChanged={onDebtChanged} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('DebtDetail — remboursement (US-050)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    debt = await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-06-01',
    });
  });

  it('shows the full remaining amount and an empty repayment history with none recorded', async () => {
    await renderDetail();

    expect(await screen.findByText('Reste dû')).toBeTruthy();
    expect((await screen.findAllByText(/500,00 MAD/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('Aucun remboursement pour le moment.')).toBeTruthy();
  });

  it('records a partial repayment, updates the remaining balance, and keeps the debt open', async () => {
    const onDebtChanged = jest.fn();
    await renderDetail(jest.fn(), onDebtChanged);

    await fireEvent.press(screen.getByText('Enregistrer un remboursement'));
    await fireEvent.changeText(screen.getByLabelText('Montant'), '200');
    await fireEvent.changeText(screen.getByLabelText('Date'), '2026-07-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onDebtChanged).toHaveBeenCalled();
    expect((await screen.findAllByText(/300,00 MAD/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Soldée')).toBeNull();

    const repayments = await listDebtRepayments(mockFakeDb);
    expect(repayments).toHaveLength(1);
    expect(repayments[0].amountMinor).toBe(20000);
  });

  it('keeps every repayment in the history after multiple partial payments', async () => {
    await createDebtRepayment(mockFakeDb, { debtId: debt.id, amountMinor: 10000, date: '2026-07-01' });
    await createDebtRepayment(mockFakeDb, { debtId: debt.id, amountMinor: 15000, date: '2026-08-01' });

    await renderDetail();

    expect(await screen.findByText('2026-07-01')).toBeTruthy();
    expect(await screen.findByText('2026-08-01')).toBeTruthy();
  });

  it('rejects a repayment larger than what remains due', async () => {
    await renderDetail();

    await fireEvent.press(screen.getByText('Enregistrer un remboursement'));
    await fireEvent.changeText(screen.getByLabelText('Montant'), '999');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Le montant dépasse le reste dû.')).toBeTruthy();
    expect(await listDebtRepayments(mockFakeDb)).toHaveLength(0);
  });

  it('marks the debt settled in one tap via "Marquer comme soldée"', async () => {
    const onDebtChanged = jest.fn();
    await renderDetail(jest.fn(), onDebtChanged);

    await fireEvent.press(screen.getByText('Marquer comme soldée'));

    expect(onDebtChanged).toHaveBeenCalled();
    expect(await screen.findByText('Soldée')).toBeTruthy();
    expect((await screen.findAllByText(/0,00 MAD/)).length).toBeGreaterThan(0);

    const repayments = await listDebtRepayments(mockFakeDb);
    expect(repayments).toHaveLength(1);
    expect(repayments[0].amountMinor).toBe(50000);
  });

  it('hides the repayment actions once the debt is settled', async () => {
    await createDebtRepayment(mockFakeDb, { debtId: debt.id, amountMinor: 50000, date: '2026-07-01' });

    await renderDetail();

    await screen.findByText('Soldée');
    expect(screen.queryByText('Enregistrer un remboursement')).toBeNull();
    expect(screen.queryByText('Marquer comme soldée')).toBeNull();
  });

  it('keeps a settled debt consultable via its repayment history', async () => {
    await createDebtRepayment(mockFakeDb, { debtId: debt.id, amountMinor: 50000, date: '2026-07-01' });

    await renderDetail();

    expect(await screen.findByText('Salma')).toBeTruthy();
    expect(await screen.findByText('2026-07-01')).toBeTruthy();
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderDetail(onBack);

    fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
