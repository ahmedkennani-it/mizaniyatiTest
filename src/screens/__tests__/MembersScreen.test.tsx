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
import { createMember, removeMember } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { MembersScreen } from '../MembersScreen';

function renderScreen(onBack: () => void = jest.fn(), plan?: Plan) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <EntitlementsProvider plan={plan}>
        <SubscriptionProvider>
          <MembersScreen onBack={onBack} />
        </SubscriptionProvider>
      </EntitlementsProvider>
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
    expect(screen.getByText('Peut modifier')).toBeTruthy();
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

    await fireEvent.press(screen.getByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('MembersScreen — limite de 1 membre en plan Gratuit (US-054)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('allows adding the first member on the Free plan', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Ajouter un membre'));

    expect(await screen.findByText('Nouveau membre')).toBeTruthy();
  });

  it('shows the Pro paywall instead of the form once the Free limit is reached', async () => {
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderScreen();

    await fireEvent.press(await screen.findByText('Ajouter un membre'));

    expect(await screen.findByText('Mizaniyati Pro')).toBeTruthy();
    expect(screen.queryByText('Nouveau membre')).toBeNull();
  });

  it('shows the Pro paywall from the invite button too, once at the Free limit', async () => {
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderScreen();

    await fireEvent.press(await screen.findByText('Inviter un membre'));

    expect(screen.queryByText(/nécessite un compte cloud/)).toBeNull();
    expect(await screen.findByText('Mizaniyati Pro')).toBeTruthy();
  });

  it('shows an inline upsell hint once at the Free limit', async () => {
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderScreen();

    expect(await screen.findByText('Le plan Gratuit est limité à 1 membre.')).toBeTruthy();
  });

  it('allows unlimited members on the Pro plan', async () => {
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderScreen(jest.fn(), PRO_PLAN);

    await fireEvent.press(await screen.findByText('Ajouter un membre'));

    expect(await screen.findByText('Nouveau membre')).toBeTruthy();
  });

  it('marks a member beyond the Free limit as read-only, without deleting anything', async () => {
    await createMember(mockFakeDb, { name: 'Amina' });
    await createMember(mockFakeDb, { name: 'Youssef' });
    await renderScreen();

    expect(await screen.findByText('Youssef')).toBeTruthy();
    expect(await screen.findByText('Lecture seule (limite du forfait)')).toBeTruthy();
  });
});

describe('MembersScreen — membres retirés (US-052)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows no "Retirés" section when nobody has been removed', async () => {
    await createMember(mockFakeDb, { name: 'Youssef' });
    await renderScreen();

    await screen.findByText('Youssef');
    expect(screen.queryByText('Retirés')).toBeNull();
  });

  it('lists a removed member under "Retirés" instead of the active list', async () => {
    const removed = await createMember(mockFakeDb, { name: 'Karim' });
    await removeMember(mockFakeDb, removed.id);
    await createMember(mockFakeDb, { name: 'Youssef' });

    await renderScreen();

    expect(await screen.findByText('Retirés')).toBeTruthy();
    expect(await screen.findByText('Karim')).toBeTruthy();
    expect(await screen.findByText('Retiré')).toBeTruthy();
  });
});
