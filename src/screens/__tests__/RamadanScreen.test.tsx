import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createMember, createTransaction } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { activateRamadanTheme } from '../../seasonalThemes';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { RamadanScreen } from '../RamadanScreen';

const RAMADAN_PLAN: Plan = {
  id: 'ramadan-test-plan',
  name: 'Test',
  isDefaultFree: false,
  entitlements: [{ key: 'ramadan', type: 'feature', booleanValue: true }],
};

function renderScreen(onBack: () => void = jest.fn(), onNavigateToZakat: () => void = jest.fn(), plan?: Plan) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={plan}>
          <RamadanScreen onBack={onBack} onNavigateToZakat={onNavigateToZakat} />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('RamadanScreen (US-026)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  it('shows the Pro upsell when the plan does not include ramadan', async () => {
    await renderScreen();

    expect(await screen.findByText('Le mode Ramadan fait partie du forfait Pro.')).toBeTruthy();
  });

  it('shows the setup form when entitled with no active theme', async () => {
    await renderScreen(jest.fn(), jest.fn(), RAMADAN_PLAN);

    expect(await screen.findByText('Activer le mode Ramadan')).toBeTruthy();
  });

  it('activates the theme and shows the envelope dashboard', async () => {
    await renderScreen(jest.fn(), jest.fn(), RAMADAN_PLAN);

    await fireEvent.changeText(screen.getByLabelText('Enveloppe Ramadan'), '7500');
    await fireEvent.changeText(screen.getByLabelText('Date de début'), '2020-01-01');
    await fireEvent.changeText(screen.getByLabelText('Date de fin'), '2099-01-30');
    await fireEvent.press(screen.getByText('Activer le mode Ramadan'));

    expect(await screen.findByText('Budget Ramadan — restant')).toBeTruthy();
    expect(await screen.findByText('Iftar & Suhoor')).toBeTruthy();
  });

  it('reduces the remaining envelope as expenses are added to a sub-category', async () => {
    const member = await createMember(mockFakeDb, { name: 'Youssef' });
    const { categories } = await activateRamadanTheme(mockFakeDb, {
      startDate: '2020-01-01',
      endDate: '2099-01-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 50000,
      currencyCode: 'MAD',
      categoryId: categories[0].id,
      memberId: member.id,
      occurredAt: new Date().toISOString(),
    });

    await renderScreen(jest.fn(), jest.fn(), RAMADAN_PLAN);

    // Remaining = 7500 - 500 = 7000 MAD.
    expect(await screen.findByText(/7.000,00 MAD|7 000,00 MAD/)).toBeTruthy();
  });

  it('signals an overspent envelope without erroring', async () => {
    const member = await createMember(mockFakeDb, { name: 'Youssef' });
    const { categories } = await activateRamadanTheme(mockFakeDb, {
      startDate: '2020-01-01',
      endDate: '2099-01-30',
      envelopeMinor: 10000,
      currencyCode: 'MAD',
      language: 'fr',
    });
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 15000,
      currencyCode: 'MAD',
      categoryId: categories[0].id,
      memberId: member.id,
      occurredAt: new Date().toISOString(),
    });

    await renderScreen(jest.fn(), jest.fn(), RAMADAN_PLAN);

    expect(await screen.findByText(/Enveloppe dépassée/)).toBeTruthy();
  });

  it('navigates to Zakat via the shortcut', async () => {
    await activateRamadanTheme(mockFakeDb, {
      startDate: '2020-01-01',
      endDate: '2099-01-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });
    const onNavigateToZakat = jest.fn();

    await renderScreen(jest.fn(), onNavigateToZakat, RAMADAN_PLAN);
    await fireEvent.press(await screen.findByText('Calculer ma Zakat'));

    expect(onNavigateToZakat).toHaveBeenCalledTimes(1);
  });

  it('shows the recap and lets the user deactivate once Ramadan has ended', async () => {
    await activateRamadanTheme(mockFakeDb, {
      startDate: '2020-01-01',
      endDate: '2020-01-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    await renderScreen(jest.fn(), jest.fn(), RAMADAN_PLAN);

    expect(await screen.findByText('Récapitulatif du Ramadan')).toBeTruthy();
    await fireEvent.press(screen.getByText('Désactiver le mode Ramadan'));

    expect(await screen.findByText('Activer le mode Ramadan')).toBeTruthy();
  });

  it('calls onBack when the back link is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack, jest.fn(), RAMADAN_PLAN);

    // The back link is now the header's chevron action (addressed by its a11y label).
    await fireEvent.press(await screen.findByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
