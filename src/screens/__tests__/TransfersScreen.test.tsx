import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createDiasporaBeneficiary,
  createDiasporaTransfer,
  createHousehold,
  listDiasporaTransfers,
  saveLanguageCountry,
  setOriginCountry,
} from '../../db/repositories';
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

describe('TransfersScreen — bénéficiaires récurrents (US-046)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows an empty state when there is no beneficiary yet', async () => {
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText('Aucun bénéficiaire enregistré.')).toBeTruthy();
  });

  it('lists a monthly beneficiary with name, relationship and rhythm', async () => {
    await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText('Fatima Benali')).toBeTruthy();
    expect(await screen.findByText(/Mère.*300,00 MAD.*mois/)).toBeTruthy();
  });

  it('lists an occasional beneficiary as "Occasionnel", without a rate', async () => {
    await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Karim Benali',
      relationship: 'Frère',
      usualAmountMinor: null,
      frequency: 'occasional',
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText(/Frère.*Occasionnel/)).toBeTruthy();
  });

  it('prefills the send form with the usual amount when a beneficiary is selected', async () => {
    await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Fatima Benali'));

    expect(await screen.findByText('Nouveau transfert')).toBeTruthy();
    expect(await screen.findByDisplayValue('300')).toBeTruthy();
  });

  it('saves a transfer linked to the selected beneficiary', async () => {
    const beneficiary = await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Fatima Benali'));
    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    expect(await screen.findByText('1 transfert(s) enregistré(s)')).toBeTruthy();
    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].amountMinor).toBe(30000);
    expect(transfers[0].beneficiaryId).toBe(beneficiary.id);
  });

  it('edits a beneficiary without losing its past transfers', async () => {
    const beneficiary = await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 30000,
      currencyCode: 'MAD',
      occurredAt: `${CURRENT_YEAR}-02-10T00:00:00.000Z`,
      beneficiaryId: beneficiary.id,
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Fatima Benali'));
    fireEvent.press(await screen.findByText('Modifier ce bénéficiaire'));
    fireEvent.changeText(await screen.findByDisplayValue('Fatima Benali'), 'Fatima B.');
    fireEvent.press(await screen.findByText('Enregistrer'));

    expect(await screen.findByText('Fatima B.')).toBeTruthy();
    expect(await screen.findByText('1 transfert(s) enregistré(s)')).toBeTruthy();
  });

  it('deletes a beneficiary and keeps its past transfers in the annual history', async () => {
    const beneficiary = await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 30000,
      currencyCode: 'MAD',
      occurredAt: `${CURRENT_YEAR}-02-10T00:00:00.000Z`,
      beneficiaryId: beneficiary.id,
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Fatima Benali'));
    fireEvent.press(await screen.findByText('Modifier ce bénéficiaire'));
    fireEvent.press(await screen.findByText('Supprimer ce bénéficiaire'));
    fireEvent.press(await screen.findByText('Oui, supprimer'));

    expect(await screen.findByText('Aucun bénéficiaire enregistré.')).toBeTruthy();
    expect(await screen.findByText('1 transfert(s) enregistré(s)')).toBeTruthy();
    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
  });
});

describe('TransfersScreen — enregistrement avec méthode et conversion (US-047)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('opens the record form with no beneficiary preselected from the "Enregistrer un transfert" button', async () => {
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));

    expect(await screen.findByText('Nouveau transfert')).toBeTruthy();
    expect(await screen.findByText('Aucun bénéficiaire')).toBeTruthy();
  });

  it('records the chosen method and the beneficiary picked from the chip list', async () => {
    const beneficiary = await createDiasporaBeneficiary(mockFakeDb, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.press(await screen.findByText('Fatima Benali'));
    fireEvent.press(await screen.findByText('Espèces'));
    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].method).toBe('cash');
    expect(transfers[0].beneficiaryId).toBe(beneficiary.id);
  });

  it('defaults to "other" and no beneficiary when neither is picked', async () => {
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.changeText(await screen.findByLabelText('Montant'), '100');
    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].method).toBe('other');
    expect(transfers[0].beneficiaryId).toBeNull();
  });

  it('shows and saves an automatic contre-valeur, indicating the mock rate date', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.changeText(await screen.findByDisplayValue(''), '100');

    expect(await screen.findByText(/données de démonstration mises à jour le/)).toBeTruthy();
    expect(await screen.findByText(/≈ .*MAD.*contre-valeur avant enregistrement/)).toBeTruthy();

    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].originAmountMinor).not.toBeNull();
    expect(transfers[0].rateIsManual).toBe(false);
  });

  it('lets a manual rate override the mock one and saves it as such', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.changeText(await screen.findByDisplayValue(''), '100');
    fireEvent.press(await screen.findByText('Taux manuel'));
    fireEvent.changeText(await screen.findByDisplayValue(''), '11');

    expect(await screen.findByText(/≈ .*1\.100,00 MAD/)).toBeTruthy();

    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].originAmountMinor).toBe(110000);
    expect(transfers[0].rateIsManual).toBe(true);
  });

  it('does not show a conversion section when the household already budgets in MAD', async () => {
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Enregistrer un transfert'));

    expect(screen.queryByText('Taux automatique')).toBeNull();
    expect(screen.queryByText('Taux manuel')).toBeNull();
  });

  it('shows the method and contre-valeur on the recorded transfer in the history', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
      method: 'wise',
      originAmountMinor: 108000,
      rateIsManual: false,
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText('Wise')).toBeTruthy();
    expect(await screen.findByText(/≈ .*1\.080,00 MAD/)).toBeTruthy();
  });

  it('opens the record form directly when navigated to with openRecordForm', async () => {
    const mockSetParams = jest.fn();
    render(
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={TRANSFERS_PLAN}>
            <TransfersScreen
              navigation={{ setParams: mockSetParams } as never}
              route={{ key: 'transfers', name: 'transfers', params: { openRecordForm: true } } as never}
            />
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>,
    );

    expect(await screen.findByText('Nouveau transfert')).toBeTruthy();
    expect(mockSetParams).toHaveBeenCalledWith({ openRecordForm: undefined });
  });
});

describe('TransfersScreen — devise du pays d’origine (US-064)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    // The Transferts screen is only reachable post-onboarding, so a settings row always exists —
    // `setOriginCountry` (like every other settings setter) requires one.
    await saveLanguageCountry(mockFakeDb, { languageCode: 'fr', countryCode: 'FR', currencyCode: 'EUR' });
  });

  it('defaults the contre-valeur to MAD when no origin country is configured', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText(/≈ .*MAD/)).toBeTruthy();
  });

  it('switches the contre-valeur currency when the household picks a different pays d’origine', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Émirats arabes unis'));

    expect(await screen.findByText(/≈ .*AED/)).toBeTruthy();
  });

  it('reads back a previously configured origin country on mount', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await setOriginCountry(mockFakeDb, 'AE');
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
    });
    await renderScreen(TRANSFERS_PLAN);

    expect(await screen.findByText(/≈ .*AED/)).toBeTruthy();
  });

  it('shows the manual rate label in the configured origin currency', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Émirats arabes unis'));
    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.changeText(await screen.findByDisplayValue(''), '100');
    fireEvent.press(await screen.findByText('Taux manuel'));

    expect(await screen.findByLabelText('Taux saisi (1 unité = ? AED)')).toBeTruthy();
  });

  it('does not offer the household’s own currency as a pays d’origine choice', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(TRANSFERS_PLAN);

    await screen.findByText('Émirats arabes unis');
    expect(screen.queryByText('France')).toBeNull();
  });

  it('never relabels a past transfer’s snapshotted contre-valeur when the origin country changes later', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await createDiasporaTransfer(mockFakeDb, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
      originAmountMinor: 108000,
      originCurrencyCode: 'MAD',
    });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Émirats arabes unis'));

    expect(await screen.findByText(/≈ .*1\.080,00 MAD/)).toBeTruthy();
  });

  it('saves the currently configured origin currency alongside a new transfer’s contre-valeur', async () => {
    await createHousehold(mockFakeDb, { name: 'Famille Dubois', currencyCode: 'EUR' });
    await renderScreen(TRANSFERS_PLAN);

    fireEvent.press(await screen.findByText('Émirats arabes unis'));
    fireEvent.press(await screen.findByText('Enregistrer un transfert'));
    fireEvent.changeText(await screen.findByDisplayValue(''), '100');
    fireEvent.press(await screen.findByText('Enregistrer le transfert'));

    const transfers = await listDiasporaTransfers(mockFakeDb);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].originCurrencyCode).toBe('AED');
  });
});
