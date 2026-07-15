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

    // The back affordance is now the ScreenHeader's chevron button (labelled "back" for a11y).
    await fireEvent.press(await screen.findByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
