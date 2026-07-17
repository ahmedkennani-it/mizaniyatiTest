import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createMember, createVault, createVaultContribution } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { VaultsScreen } from '../VaultsScreen';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <VaultsScreen onBack={onBack} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('VaultsScreen (US-023)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the empty state when there are no vaults', async () => {
    await renderScreen();

    expect(await screen.findByText('Aucun coffre pour le moment.')).toBeTruthy();
  });

  it('lists a vault with its progress and total saved', async () => {
    const vault = await createVault(mockFakeDb, {
      name: 'Omra 2027',
      targetMinor: 300000,
      currencyCode: 'MAD',
    });
    const member = await createMember(mockFakeDb, { name: 'Youssef' });
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 150000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await renderScreen();

    expect(await screen.findByText('Omra 2027')).toBeTruthy();
    expect(await screen.findByText('50 %')).toBeTruthy();
    expect(await screen.findByText('Total épargné')).toBeTruthy();
  });

  /** US-032: the hero shows how many vaults exist, not just the total saved. */
  it('shows the number of vaults alongside the total saved', async () => {
    await createVault(mockFakeDb, { name: 'Omra 2027', targetMinor: 300000, currencyCode: 'MAD' });
    await createVault(mockFakeDb, { name: 'Voiture', targetMinor: 500000, currencyCode: 'MAD' });

    await renderScreen();

    expect(await screen.findByText(/2 coffre/)).toBeTruthy();
  });

  it('shows the deadline on a vault row, or "Sans échéance" when there is none', async () => {
    await createVault(mockFakeDb, {
      name: 'Omra 2027',
      targetMinor: 300000,
      currencyCode: 'MAD',
      deadline: '2027-06-01',
    });
    await createVault(mockFakeDb, { name: 'Urgence', targetMinor: 500000, currencyCode: 'MAD' });

    await renderScreen();

    expect(await screen.findByText(/Échéance/)).toBeTruthy();
    expect(await screen.findByText('Sans échéance')).toBeTruthy();
  });

  /** US-032: a goal at 0% must stay visible with an empty bar, not be filtered out. */
  it('keeps a goal at 0% visible', async () => {
    await createVault(mockFakeDb, { name: 'Fonds neuf', targetMinor: 100000, currencyCode: 'MAD' });

    await renderScreen();

    expect(await screen.findByText('Fonds neuf')).toBeTruthy();
    expect(screen.getByText('0 %')).toBeTruthy();
  });

  it('opens the vault detail on tap', async () => {
    await createVault(mockFakeDb, { name: 'Omra 2027', targetMinor: 300000, currencyCode: 'MAD' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Omra 2027'));

    expect(await screen.findByText('Épargné')).toBeTruthy();
  });

  it('opens the form to add a new vault', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Ajouter un coffre'));

    expect(await screen.findByText('Nouveau coffre')).toBeTruthy();
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    await fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
