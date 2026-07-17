import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createDiasporaTransfer, createHousehold } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { TransfersScreen } from '../TransfersScreen';

const TRANSFERS_PLAN: Plan = {
  id: 'transfers-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'transfers', type: 'feature', booleanValue: true }],
};

function renderScreen(plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <TransfersScreen />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

describe('TransfersScreen (US-045)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the Pro upsell when the plan does not include transfers', async () => {
    await renderScreen();

    expect(await screen.findByText('Le suivi des transferts fait partie du forfait Pro.')).toBeTruthy();
  });

  it('shows the "not a transfer service" disclaimer', async () => {
    await renderScreen(TRANSFERS_PLAN);

    expect(
      await screen.findByText("Les envois sont enregistrés manuellement. Mizaniyati n'est pas un service de transfert d'argent."),
    ).toBeTruthy();
  });

  it('starts at zero for the current year with no transfers yet', async () => {
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText(/0,00 MAD/)).toBeTruthy();
    expect(await screen.findByText('0 transfert(s) enregistré(s)')).toBeTruthy();
  });

  it('totals the current year’s transfers and counts them', async () => {
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 30000,
      currencyCode: 'MAD',
      occurredAt: `${CURRENT_YEAR}-02-10T00:00:00.000Z`,
    });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 20000,
      currencyCode: 'MAD',
      occurredAt: `${CURRENT_YEAR}-05-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText(/500,00 MAD/)).toBeTruthy();
    expect(await screen.findByText('2 transfert(s) enregistré(s)')).toBeTruthy();
  });

  it('resets to zero and keeps the previous year selectable when the year changes', async () => {
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 50000,
      currencyCode: 'MAD',
      occurredAt: `${PREVIOUS_YEAR}-09-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    // Defaults to the current year, which has nothing yet.
    expect(await screen.findByText(/0,00 MAD/)).toBeTruthy();

    await fireEvent.press(await screen.findByText(String(PREVIOUS_YEAR)));

    expect((await screen.findAllByText(/500,00 MAD/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('1 transfert(s) enregistré(s)')).toBeTruthy();
  });

  it('shows an approximate equivalent in the origin currency for a non-MAD household', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    expect((await screen.findAllByText(/100,00 €/)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/≈ .*MAD/)).toBeTruthy();
  });
});
