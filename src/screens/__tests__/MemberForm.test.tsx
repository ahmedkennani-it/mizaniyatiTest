import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';
import {
  createCategory,
  createMember,
  createTransaction,
  listMembers,
  listTransactions,
} from '../../db/repositories';
import type { Member } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { ThemeProvider } from '../../theme';
import { MemberForm } from '../MemberForm';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

function renderForm(
  member?: Member,
  otherMembers: Member[] = [],
  transactionsToReassign: Awaited<ReturnType<typeof listTransactions>> = [],
  onSaved: () => void = jest.fn(),
  onDeleted: () => void = jest.fn(),
) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <MemberForm
        member={member}
        otherMembers={otherMembers}
        transactionsToReassign={transactionsToReassign}
        onSaved={onSaved}
        onCancel={jest.fn()}
        onDeleted={onDeleted}
      />
    </ThemeProvider>,
  );
}

describe('MemberForm — création (US-027)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('creates a member with the default editor role', async () => {
    const onSaved = jest.fn();
    await renderForm(undefined, [], [], onSaved);

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Salma');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    const all = await listMembers(mockFakeDb);
    expect(all).toMatchObject([{ name: 'Salma', role: 'editor' }]);
  });

  it('creates a viewer-role member', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Amina');
    await fireEvent.press(screen.getByText('Lecture seule'));
    await fireEvent.press(screen.getByText('Enregistrer'));

    const all = await listMembers(mockFakeDb);
    expect(all[0].role).toBe('viewer');
  });

  it('shows a validation error when the name is empty', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Saisissez un nom de membre.')).toBeTruthy();
    expect(await listMembers(mockFakeDb)).toHaveLength(0);
  });
});

describe('MemberForm — édition et suppression (US-027)', () => {
  let member: Member;
  let other: Member;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    member = await createMember(mockFakeDb, { name: 'Salma' });
    other = await createMember(mockFakeDb, { name: 'Youssef' });
  });

  it('blocks deletion when it is the last member', async () => {
    await renderForm(member, []);

    expect(await screen.findByText('Vous devez conserver au moins un membre.')).toBeTruthy();
    expect(screen.queryByText('Supprimer')).toBeNull();
  });

  it('deletes a member with no transactions after confirming', async () => {
    const onDeleted = jest.fn();
    await renderForm(member, [other], [], jest.fn(), onDeleted);

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(screen.getByText('Oui, supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(await listMembers(mockFakeDb)).toHaveLength(1);
  });

  it('reassigns transactions to another member before deleting', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#000000',
    });
    const transaction = await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-01T00:00:00.000Z',
    });

    const onDeleted = jest.fn();
    await renderForm(member, [other], [transaction], jest.fn(), onDeleted);

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(screen.getByText('Youssef'));
    await fireEvent.press(screen.getByText('Réaffecter et supprimer'));

    expect(onDeleted).toHaveBeenCalledTimes(1);
    const all = await listTransactions(mockFakeDb);
    expect(all[0].memberId).toBe(other.id);
  });
});
