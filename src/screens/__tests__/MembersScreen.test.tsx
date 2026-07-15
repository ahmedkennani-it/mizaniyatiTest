import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createMember } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { MembersScreen } from '../MembersScreen';

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <MembersScreen onBack={onBack} />
    </ThemeProvider>,
  );
}

describe('MembersScreen (US-027)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('lists existing members with their role', async () => {
    await createMember(mockFakeDb, { name: 'Youssef', role: 'editor' });
    await createMember(mockFakeDb, { name: 'Salma', role: 'viewer' });

    await renderScreen();

    expect(await screen.findByText('Youssef')).toBeTruthy();
    expect(await screen.findByText('Salma')).toBeTruthy();
    expect(screen.getByText('Éditeur')).toBeTruthy();
    expect(screen.getByText('Lecture seule')).toBeTruthy();
  });

  it('opens the form to add a new member', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Ajouter un membre'));

    expect(await screen.findByText('Nouveau membre')).toBeTruthy();
  });

  it('opens the edit form when tapping an existing member', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });
    await renderScreen();

    await fireEvent.press(await screen.findByText('Youssef'));

    expect(await screen.findByText('Modifier le membre')).toBeTruthy();
  });

  it('shows the cloud-required message on the invite flow', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Inviter un membre'));

    expect(await screen.findByText(/nécessite un compte cloud/)).toBeTruthy();
  });

  it('calls onBack when the header back button is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    // Back is now the ScreenHeader's chevron (labelled "back" for a11y), not a "Retour" text link.
    await fireEvent.press(screen.getByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
