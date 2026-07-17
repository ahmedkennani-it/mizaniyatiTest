import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  createHousehold,
  listTontineGroups,
  listTontineMembers,
  listTontineRounds,
} from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';
import { TontineGroupForm } from '../TontineGroupForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(onSaved: () => void = jest.fn(), onCancel: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <TontineGroupForm onSaved={onSaved} onCancel={onCancel} />
      </ThemeProvider>
    </LanguageProvider>,
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
    expect(
      await screen.findByText('Saisissez une cagnotte valide, supérieure à zéro.'),
    ).toBeTruthy();
    expect(
      await screen.findByText('Ajoutez au moins deux membres, chacun avec un nom.'),
    ).toBeTruthy();
    expect(await screen.findByText('Indiquez lequel des membres est vous.')).toBeTruthy();
    expect(await listTontineGroups(mockFakeDb)).toHaveLength(0);
  });

  it('creates a group with two members, marking self, generating rounds', async () => {
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom du groupe'), 'Tontine famille');
    await fireEvent.changeText(screen.getByLabelText('Cotisation par membre'), '1000');
    await fireEvent.changeText(screen.getByLabelText('Mois du premier tour'), '2026-07');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 1'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 2'), 'Salma');
    await fireEvent.press(screen.getAllByText("C'est moi")[0]);
    await fireEvent.press(screen.getByText('Créer la tontine'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const groups = await listTontineGroups(mockFakeDb);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: 'Tontine famille',
      contributionPerRoundMinor: 100000,
      memberCount: 2,
    });

    const members = await listTontineMembers(mockFakeDb);
    expect(members.map((m) => m.name)).toEqual(['Youssef', 'Salma']);
    expect(members[0].isSelf).toBe(true);

    expect(await listTontineRounds(mockFakeDb)).toHaveLength(2);
  });

  it('creates the group in the household currency, not a hardcoded default', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'EUR' });
    const onSaved = jest.fn();
    await renderForm(onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom du groupe'), 'Tontine famille');
    await fireEvent.changeText(screen.getByLabelText('Cotisation par membre'), '1000');
    await fireEvent.changeText(screen.getByLabelText('Mois du premier tour'), '2026-07');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 1'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 2'), 'Salma');
    await fireEvent.press(screen.getAllByText("C'est moi")[0]);
    await fireEvent.press(screen.getByText('Créer la tontine'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const groups = await listTontineGroups(mockFakeDb);
    expect(groups[0]).toMatchObject({ currencyCode: 'EUR' });
  });

  it('adds and removes a member field', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Ajouter un membre'));
    expect(screen.getByLabelText('Nom du membre 3')).toBeTruthy();

    await fireEvent.press(screen.getAllByText('Retirer')[0]);
    expect(screen.queryByLabelText('Nom du membre 3')).toBeNull();
  });

  it('reorders members with the up/down controls, keeping "self" pointed at the right person', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nom du membre 1'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 2'), 'Salma');
    await fireEvent.press(screen.getAllByText("C'est moi")[0]);

    await fireEvent.press(screen.getAllByLabelText('Descendre dans l\'ordre des tours')[0]);

    expect(screen.getByLabelText('Nom du membre 1').props.value).toBe('Salma');
    expect(screen.getByLabelText('Nom du membre 2').props.value).toBe('Youssef');
    // "self" followed Youssef to his new position rather than staying on row 1.
    const selfChips = screen.getAllByRole('button', { name: "C'est moi" });
    expect(selfChips[0].props.accessibilityState.selected).toBe(false);
    expect(selfChips[1].props.accessibilityState.selected).toBe(true);
  });

  it('recalculates the pot and round count live as members and contribution change', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Cotisation par membre'), '1000');
    expect(await screen.findByText('Nombre de tours : 0')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Nom du membre 1'), 'Youssef');
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 2'), 'Salma');

    expect(await screen.findByText('Nombre de tours : 2')).toBeTruthy();
    expect(
      await screen.findByText(new RegExp(`Cagnotte du tour : ‎?2\\.000,00`)),
    ).toBeTruthy();

    await fireEvent.press(screen.getByText('Ajouter un membre'));
    await fireEvent.changeText(screen.getByLabelText('Nom du membre 3'), 'Karim');

    expect(await screen.findByText('Nombre de tours : 3')).toBeTruthy();
    expect(
      await screen.findByText(new RegExp(`Cagnotte du tour : ‎?3\\.000,00`)),
    ).toBeTruthy();
  });

  it('shows the periodicity field with only monthly selectable today', async () => {
    await renderForm();

    expect(await screen.findByText('Mensuelle')).toBeTruthy();
    expect(
      await screen.findByText('Périodicité hebdomadaire : bientôt disponible.'),
    ).toBeTruthy();
  });

  it('calls onCancel', async () => {
    const onCancel = jest.fn();
    await renderForm(jest.fn(), onCancel);

    await fireEvent.press(screen.getByText('Annuler'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
