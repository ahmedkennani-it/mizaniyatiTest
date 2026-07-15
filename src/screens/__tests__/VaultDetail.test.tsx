import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createMember, createVault, createVaultContribution, listVaultContributions } from '../../db/repositories';
import type { Member, Vault } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { VaultDetail } from '../VaultDetail';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

let vault: Vault;
let member: Member;

function renderDetail(
  onBack: () => void = jest.fn(),
  onVaultChanged: () => void = jest.fn(),
  onVaultDeleted: () => void = jest.fn(),
) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <VaultDetail vault={vault} onBack={onBack} onVaultChanged={onVaultChanged} onVaultDeleted={onVaultDeleted} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('VaultDetail (US-023)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    vault = await createVault(mockFakeDb, {
      name: 'Omra 2027',
      targetMinor: 300000,
      currencyCode: 'MAD',
      deadline: '2027-01-01',
    });
    member = await createMember(mockFakeDb, { name: 'Youssef' });
  });

  it('shows the empty contributions state', async () => {
    await renderDetail();

    expect(await screen.findByText('Aucun versement pour le moment.')).toBeTruthy();
  });

  it('adds a contribution and shows it in the history', async () => {
    await renderDetail();

    await fireEvent.press(screen.getByText('Ajouter un versement'));
    await fireEvent.changeText(screen.getByLabelText('Montant'), '444');
    await fireEvent.press(screen.getByText('Youssef'));
    await fireEvent.changeText(screen.getByLabelText('Note (optionnel)'), 'Prime de juin');
    await fireEvent.press(screen.getByText('Enregistrer le versement'));

    const contributions = await listVaultContributions(mockFakeDb);
    expect(contributions).toHaveLength(1);
    expect(contributions[0].amountMinor).toBe(44400);
    expect(await screen.findByText('Prime de juin')).toBeTruthy();
  });

  it('recalculates saved/percentage after deleting a contribution', async () => {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 100000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
      note: 'Premier versement',
    });
    await renderDetail();
    await screen.findByText('Premier versement');

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(screen.getByText('Oui, supprimer'));

    expect(await listVaultContributions(mockFakeDb)).toHaveLength(0);
    expect(screen.queryByText('Premier versement')).toBeNull();
  });

  it('marks the vault reached once contributions cover the target', async () => {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 350000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await renderDetail();

    expect(await screen.findByText(/Objectif atteint/)).toBeTruthy();
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderDetail(onBack);

    // The back affordance is now the ScreenHeader's chevron button (labelled "back" for a11y).
    await fireEvent.press(await screen.findByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
