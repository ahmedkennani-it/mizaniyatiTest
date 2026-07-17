import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createCategory,
  createHousehold,
  createMember,
  createTransaction,
  listCategories,
  listMembers,
  listTransactions,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#0D9488' });
  await createMember(mockFakeDb, { name: 'Youssef' });
}

async function renderHome() {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider>
            <ExpenseEntryProvider>
              <HomeScreen />
            </ExpenseEntryProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

async function deleteTheOnlyTransaction() {
  await fireEvent.press(screen.getByText('Une opération'));
  await fireEvent.press(await screen.findByText(fr.expenseForm.delete));
  await fireEvent.press(await screen.findByText(fr.expenseForm.deleteConfirmYes));
}

/** US-024: "confirmation demandée" is already covered elsewhere — this covers the 5s "Annuler". */
describe('undo delete (US-024)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await seed();
    const [category] = await listCategories(mockFakeDb);
    const [member] = await listMembers(mockFakeDb);
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: new Date().toISOString(),
      note: 'Une opération',
    });
  });

  it('offers "Annuler" right after a deletion', async () => {
    await renderHome();
    await screen.findByText('Une opération');

    await deleteTheOnlyTransaction();

    expect(await screen.findByText(fr.expenseForm.deletedUndoMessage)).toBeTruthy();
    expect(screen.getByText(fr.expenseForm.cancel)).toBeTruthy();
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
  });

  it('restores the transaction when "Annuler" is pressed', async () => {
    await renderHome();
    await screen.findByText('Une opération');

    await deleteTheOnlyTransaction();
    await screen.findByText(fr.expenseForm.deletedUndoMessage);
    await fireEvent.press(screen.getByText(fr.expenseForm.cancel));

    const restored = await listTransactions(mockFakeDb);
    expect(restored).toHaveLength(1);
    expect(restored[0].amountMinor).toBe(1000);
    expect(restored[0].note).toBe('Une opération');
    expect(screen.queryByText(fr.expenseForm.deletedUndoMessage)).toBeNull();
  });

  it('lets the deletion stand once the 5s window has passed', async () => {
    jest.useFakeTimers();
    await renderHome();
    await screen.findByText('Une opération');

    await deleteTheOnlyTransaction();
    await screen.findByText(fr.expenseForm.deletedUndoMessage);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(fr.expenseForm.deletedUndoMessage)).toBeNull();
    expect(await listTransactions(mockFakeDb)).toHaveLength(0);
    jest.useRealTimers();
  });
});
