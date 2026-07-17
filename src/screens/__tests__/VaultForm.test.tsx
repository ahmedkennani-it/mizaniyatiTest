import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createVault, listVaults } from '../../db/repositories';
import type { Vault } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { formatMoney } from '../../money';
import { ThemeProvider } from '../../theme';
import { VaultForm } from '../VaultForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(
  vault?: Vault,
  onSaved: () => void = jest.fn(),
  onDeleted: () => void = jest.fn(),
  savedMinor = 0,
) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <VaultForm
          vault={vault}
          savedMinor={savedMinor}
          onSaved={onSaved}
          onCancel={jest.fn()}
          onDeleted={onDeleted}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('VaultForm — création (US-023)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('creates a vault with a deadline', async () => {
    const onSaved = jest.fn();
    await renderForm(undefined, onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Omra 2027');
    await fireEvent.changeText(screen.getByLabelText('Objectif'), '30000');
    await fireEvent.changeText(screen.getByLabelText('Échéance (optionnel)'), '2027-06-01');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listVaults(mockFakeDb);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      name: 'Omra 2027',
      targetMinor: 3000000,
      deadline: '2027-06-01',
    });
  });

  it('creates a vault without a deadline', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nom'), "Fonds d'urgence");
    await fireEvent.changeText(screen.getByLabelText('Objectif'), '10000');
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listVaults(mockFakeDb);
    expect(all[0].deadline).toBeNull();
  });

  it('shows a validation error and does not create when the name is empty', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un nom de coffre.')).toBeTruthy();
    expect(await listVaults(mockFakeDb)).toHaveLength(0);
  });

  it('rejects an invalid deadline', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Voiture');
    await fireEvent.changeText(screen.getByLabelText('Objectif'), '50000');
    await fireEvent.changeText(screen.getByLabelText('Échéance (optionnel)'), 'pas-une-date');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez une échéance valide (AAAA-MM-JJ).')).toBeTruthy();
    expect(await listVaults(mockFakeDb)).toHaveLength(0);
  });

  /** US-033: the suggested monthly amount updates live, as soon as a target + deadline are set,
   *  without needing to submit first. */
  it('shows a live suggested-monthly preview once a target and deadline are entered', async () => {
    await renderForm();

    expect(screen.queryByText(/Versement mensuel suggéré/)).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Objectif'), '30000');
    expect(screen.queryByText(/Versement mensuel suggéré/)).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Échéance (optionnel)'), '2099-06-01');

    expect(await screen.findByText(/Versement mensuel suggéré/)).toBeTruthy();
  });
});

describe('VaultForm — édition et suppression (US-023)', () => {
  let vault: Vault;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    vault = await createVault(mockFakeDb, {
      name: 'Omra 2027',
      targetMinor: 3000000,
      currencyCode: 'MAD',
      deadline: '2027-06-01',
    });
  });

  it('pre-fills the form with the existing vault', async () => {
    await renderForm(vault);

    expect(screen.getByLabelText('Nom').props.value).toBe('Omra 2027');
    expect(screen.getByLabelText('Objectif').props.value).toBe('30000');
    expect(screen.getByLabelText('Échéance (optionnel)').props.value).toBe('2027-06-01');
  });

  it('reflects the already-saved amount in the live preview when editing', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      // Deadline is 2027-06-01 → 17 whole months from 2026-01-01.
      const remainingMinor = vault.targetMinor - 1000000;
      // RNTL's text normalizer collapses all whitespace (including the non-breaking space
      // `Intl.NumberFormat` puts before the currency code) to plain spaces before matching a
      // RegExp against it, so the pattern built here must do the same or it silently never matches.
      const expectedCore = formatMoney(Math.ceil(remainingMinor / 17), 'MAD', 'fr')
        .replace(/‎/g, '')
        .replace(/\s/g, ' ');
      const expectedPattern = new RegExp(expectedCore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      await renderForm(vault, jest.fn(), jest.fn(), 1000000);

      expect(await screen.findByText(expectedPattern)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('updates the vault', async () => {
    const onSaved = jest.fn();
    await renderForm(vault, onSaved);

    await fireEvent.changeText(screen.getByLabelText('Objectif'), '35000');
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listVaults(mockFakeDb);
    expect(all[0].targetMinor).toBe(3500000);
  });

  it('deletes the vault after confirming', async () => {
    const onDeleted = jest.fn();
    await renderForm(vault, jest.fn(), onDeleted);

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(screen.getByText('Oui, supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(await listVaults(mockFakeDb)).toHaveLength(0);
  });
});
