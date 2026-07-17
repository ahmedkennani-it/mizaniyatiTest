import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createDiasporaBeneficiary, createDiasporaTransfer } from '../../db/repositories';
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
import { TransfersScreen } from '../TransfersScreen';

const TRANSFERS_PLAN: Plan = {
  id: 'transfers-rtl-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'transfers', type: 'feature', booleanValue: true }],
};

function renderScreen() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={TRANSFERS_PLAN}>
          <TransfersScreen />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

/**
 * `TransfersScreen` is built entirely from shared, direction-agnostic primitives (`AppScreen`,
 * `Card`, `Chip`, `ListRow`, `SectionHeader`...) with no `left`/`right` styling of its own, so this
 * is the same stand-in for a device/browser RTL pass used by `HomeScreen.rtl.test.tsx` and
 * `RootNavigator.rtl.test.tsx` — it proves the screen still renders correctly (nothing crashes,
 * every string is still there) under the RTL layout flag, not the mirrored pixel layout itself.
 */
describe('TransfersScreen under RTL and LTR (US-045)', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders the total, disclaimer and history in LTR', async () => {
    I18nManager.isRTL = false;
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'MAD',
      occurredAt: `${new Date().getFullYear()}-01-15T00:00:00.000Z`,
    });
    await renderScreen();

    expect(await screen.findByText(fr.transfersScreen.title)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.disclaimer)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.totalLabel)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.historyTitle)).toBeTruthy();
  });

  it('renders the total, disclaimer and history under the RTL layout flag', async () => {
    I18nManager.isRTL = true;
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'MAD',
      occurredAt: `${new Date().getFullYear()}-01-15T00:00:00.000Z`,
    });
    await renderScreen();

    expect(await screen.findByText(fr.transfersScreen.title)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.disclaimer)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.totalLabel)).toBeTruthy();
    expect(screen.getByText(fr.transfersScreen.historyTitle)).toBeTruthy();
  });

  it('renders the beneficiary list and the send/edit form under the RTL layout flag', async () => {
    I18nManager.isRTL = true;
    await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await renderScreen();

    expect(await screen.findByText('Fatima Benali')).toBeTruthy();

    fireEvent.press(screen.getByText('Fatima Benali'));
    expect(await screen.findByText('Envoyer à Fatima Benali')).toBeTruthy();

    fireEvent.press(screen.getByText(fr.transfersScreen.sendEditBeneficiary));
    expect(await screen.findByText(fr.beneficiaryForm.titleEdit)).toBeTruthy();
  });
});
