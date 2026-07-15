import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { listZakatAssessments } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ZakatScreen } from '../ZakatScreen';

const ZAKAT_PLAN: Plan = {
  id: 'zakat-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'zakat', type: 'feature', booleanValue: true }],
};

function renderScreen(onBack: () => void = jest.fn(), plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <ZakatScreen onBack={onBack} />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('ZakatScreen (US-025)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the Pro upsell when the plan does not include zakat', async () => {
    await renderScreen(jest.fn());

    expect(
      await screen.findByText('Le calcul de la Zakat fait partie du forfait Pro.'),
    ).toBeTruthy();
  });

  it('shows the disclaimer and defaults to the gold nisab basis', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    expect(await screen.findByText(/n'émet pas de fatwa/)).toBeTruthy();
    expect(await screen.findByText('Saisissez un prix pour calculer le nisab.')).toBeTruthy();
  });

  it('computes the nisab once a gold price is entered and saved', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(screen.getByLabelText("Prix de l'or (par gramme)"), '600');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));

    // Nisab = 600 MAD/g * 85g = 51 000 MAD.
    expect(await screen.findByText(/51.000,00 MAD|51 000,00 MAD/)).toBeTruthy();
  });

  it('computes base and due, and marks above nisab once assets clear it', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(screen.getByLabelText("Prix de l'or (par gramme)"), '100');
    await fireEvent.press(screen.getByText('Mettre à jour la configuration'));
    // Nisab = 100 * 85 = 8 500 MAD.

    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '10000');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '1000');

    expect(await screen.findByText('Au-dessus du nisab · Zakat obligatoire')).toBeTruthy();
    // base = 10000 - 1000 = 9000 MAD, due = 225 MAD.
    expect(await screen.findByText(/225,00 MAD/)).toBeTruthy();
  });

  it('floors the base at zero when debts exceed assets', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '100');
    await fireEvent.changeText(screen.getByLabelText('Dettes à déduire'), '500');

    expect(await screen.findByText(/Base zakatable: .?0,00 MAD/)).toBeTruthy();
  });

  it('saves an assessment to history', async () => {
    await renderScreen(jest.fn(), ZAKAT_PLAN);

    await fireEvent.changeText(screen.getByLabelText('Liquidités & comptes'), '1000');
    await fireEvent.press(screen.getByText('Enregistrer ce calcul'));

    const assessments = await listZakatAssessments(mockFakeDb);
    expect(assessments).toHaveLength(1);
    expect(assessments[0].baseMinor).toBe(100000);
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack, ZAKAT_PLAN);

    // The back link is now the header's chevron action (addressed by its a11y label).
    await fireEvent.press(await screen.findByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
