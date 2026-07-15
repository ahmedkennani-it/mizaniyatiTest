import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';
import { createVault, listVaults } from '../../db/repositories';
import type { Vault } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { ThemeProvider } from '../../theme';
import { VaultForm } from '../VaultForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(vault?: Vault, onSaved: () => void = jest.fn(), onDeleted: () => void = jest.fn()) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <VaultForm vault={vault} onSaved={onSaved} onCancel={jest.fn()} onDeleted={onDeleted} />
    </ThemeProvider>,
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
    expect(all[0]).toMatchObject({ name: 'Omra 2027', targetMinor: 3000000, deadline: '2027-06-01' });
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
