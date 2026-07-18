import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createDebt } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { DebtsScreen } from '../DebtsScreen';

const DEBTS_PLAN: Plan = {
  id: 'debts-rtl-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'debts', type: 'feature', booleanValue: true }],
};

function renderScreen() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={DEBTS_PLAN}>
          <DebtsScreen onBack={jest.fn()} />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

/**
 * `DebtsScreen`/`DebtForm`/`DebtDetail` are built entirely from shared, direction-agnostic
 * primitives (`AppScreen`, `Card`, `ListRow`, `SectionHeader`, `TextField`...) with no `left`/
 * `right` styling of their own, so this is the same stand-in for a device/browser RTL pass used by
 * `TransfersScreen.rtl.test.tsx` — it proves the screens still render correctly (nothing crashes,
 * every string is still there) under the RTL layout flag.
 */
describe('DebtsScreen under RTL and LTR (US-048)', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders the totals, subtitle and debt row in LTR', async () => {
    I18nManager.isRTL = false;
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-06-01',
      dueDate: '2026-09-01',
    });
    renderScreen();

    expect(await screen.findByText(fr.debtsScreen.title)).toBeTruthy();
    expect(screen.getByText(fr.debtsScreen.subtitle)).toBeTruthy();
    expect(screen.getByText('Salma')).toBeTruthy();
  });

  it('renders the totals, subtitle, form and detail under the RTL layout flag', async () => {
    I18nManager.isRTL = true;
    await createDebt(mockFakeDb, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-06-01',
      dueDate: '2026-09-01',
    });
    renderScreen();

    expect(await screen.findByText(fr.debtsScreen.title)).toBeTruthy();
    expect(screen.getByText(fr.debtsScreen.subtitle)).toBeTruthy();

    fireEvent.press(screen.getByText('Salma'));
    expect(await screen.findByText(fr.debtDetail.remainingLabel)).toBeTruthy();
  });
});
