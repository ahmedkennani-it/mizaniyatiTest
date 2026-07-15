import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';
import { listTontineGroups, listTontineMembers, listTontineRounds } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { ThemeProvider } from '../../theme';
import { TontineGroupForm } from '../TontineGroupForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(onSaved: () => void = jest.fn(), onCancel: () => void = jest.fn()) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <TontineGroupForm onSaved={onSaved} onCancel={onCancel} />
    </ThemeProvider>,
  );
}

describe('TontineGroupForm (US-024)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows validation errors when submitted empty', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Créer la tontine'));

    expect(await screen.findByText('Saisissez un nom de groupe.')).toBeTruthy();
    expect(await screen.findByText('Saisissez une cagnotte valide, supérieure à zéro.')).toBeTruthy();
    expect(await screen.findByText('Ajoutez au moins deux membres, chacun avec un nom.')).toBeTruthy();
    expect(await screen.findByText('Indiquez lequel des membres est vous.')).toBeTruthy();
    expect(await listTontineGroups(mockFakeDb)).toHaveLength(0);
  });

  it('creates a group with two members, marking self, generating rounds', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom du groupe'), 'Tontine famille');
    await fireEvent.changeText(screen.getByLabelText('Cagnotte par tour'), '1000');
    await fireEvent.changeText(screen.getByLabelText('Mois du premier tour'), '2026-07');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 1'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 2'), 'Salma');
    await fireEvent.press(screen.getAllByText("C'est moi")[0]);
    await fireEvent.press(screen.getByText('Créer la tontine'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const groups = await listTontineGroups(mockFakeDb);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ name: 'Tontine famille', contributionPerRoundMinor: 100000, memberCount: 2 });

    const members = await listTontineMembers(mockFakeDb);
    expect(members.map((m) => m.name)).toEqual(['Youssef', 'Salma']);
    expect(members[0].isSelf).toBe(true);

    expect(await listTontineRounds(mockFakeDb)).toHaveLength(2);
  });

  it('adds and removes a member field', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Ajouter un membre'));
    expect(screen.getByLabelText('Nom du membre 3')).toBeTruthy();

    await fireEvent.press(screen.getAllByText('Retirer')[0]);
    expect(screen.queryByLabelText('Nom du membre 3')).toBeNull();
  });

  it('calls onCancel', async () => {
    const onCancel = jest.fn();
    await renderForm(jest.fn(), onCancel);

    await fireEvent.press(screen.getByText('Annuler'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
