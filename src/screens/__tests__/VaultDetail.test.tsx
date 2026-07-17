import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  createMember,
  createVault,
  createVaultContribution,
  listVaultContributions,
} from '../../db/repositories';
import type { Member, Vault } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { formatShortDate } from '../../i18n/dateFormat';
import { formatMoney } from '../../money';
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
        <VaultDetail
          vault={vault}
          onBack={onBack}
          onVaultChanged={onVaultChanged}
          onVaultDeleted={onVaultDeleted}
        />
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

    await fireEvent.press(screen.getByText("Ajouter de l'argent"));
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
    // `fireEvent.press` awaits the dispatch, not the handler's async chain (delete → reload → set
    // state), so the row only goes once those settle. The explicit timeout is what makes this
    // deterministic: the 1s default is enough on an idle machine but not when the whole suite runs
    // in parallel, which showed up as a flake failing only in full runs.
    await waitFor(() => expect(screen.queryByText('Premier versement')).toBeNull(), {
      timeout: 5000,
    });
  });

  it('marks the vault reached once contributions cover the target', async () => {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 350000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await renderDetail();

    expect(await screen.findByText(/objectif atteint/)).toBeTruthy();
  });

  /** US-032: a contribution row must show who gave it and when, not one or the other. */
  it('shows the date and member name together on a contribution row', async () => {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 100000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await renderDetail();

    const expectedDate = formatShortDate(new Date('2026-07-01T10:00:00.000Z'), 'fr');
    expect(await screen.findByText(`${expectedDate} · Youssef`)).toBeTruthy();
  });

  it('shows the contribution amount prefixed with a plus sign', async () => {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: 100000,
      memberId: member.id,
      date: '2026-07-01T10:00:00.000Z',
    });

    await renderDetail();

    const expected = `+${formatMoney(100000, 'MAD', 'fr')}`;
    expect(await screen.findByText(expected)).toBeTruthy();
  });

  it('shows an overdue badge once the deadline has passed without reaching the target', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2027-02-01T00:00:00.000Z'));
    try {
      await renderDetail();

      expect(await screen.findByText('En retard')).toBeTruthy();
      expect(await screen.findByText(/Échéance dépassée/)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the number of months remaining alongside the suggested monthly amount', async () => {
    jest.useFakeTimers();
    // Deadline is 2027-01-01 → exactly 12 whole months away.
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      await renderDetail();

      expect(await screen.findByText(/sur 12 mois/)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderDetail(onBack);

    await fireEvent.press(await screen.findByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
