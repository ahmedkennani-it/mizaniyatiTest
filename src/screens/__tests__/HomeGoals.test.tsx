import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
  ensureMigrated: () => Promise.resolve(),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createHousehold, createMember, createVault, createVaultContribution } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Member } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { monthKeyOf } from '../../i18n/dateFormat';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

const THIS_MONTH = monthKeyOf(new Date());

let member: Member;

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  member = await createMember(mockFakeDb, { name: 'Youssef' });
}

async function addGoal(name: string, targetMinor: number, savedMinor = 0) {
  const vault = await createVault(mockFakeDb, { name, targetMinor, currencyCode: 'MAD' });
  if (savedMinor > 0) {
    await createVaultContribution(mockFakeDb, {
      vaultId: vault.id,
      amountMinor: savedMinor,
      memberId: member.id,
      date: `${THIS_MONTH}-02T10:00:00.000Z`,
    });
  }
  return vault;
}

async function renderHome() {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <ExpenseEntryProvider>
            <HomeScreen />
          </ExpenseEntryProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('goals preview (US-011)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('previews the first two goals with their progress and saved / target', async () => {
    await seed();
    await addGoal('Omra', 1000000, 250000);
    await addGoal('Voiture', 5000000, 500000);
    await renderHome();

    expect(await screen.findByText('Omra')).toBeTruthy();
    expect(screen.getByText('Voiture')).toBeTruthy();
    expect(screen.getByText(/2\.500.*\/.*10\.000.*MAD/)).toBeTruthy();
    expect(screen.getByText(/5\.000.*\/.*50\.000.*MAD/)).toBeTruthy();
  });

  it('previews only two, however many exist', async () => {
    await seed();
    await addGoal('Omra', 1000000);
    await addGoal('Voiture', 5000000);
    await addGoal('Urgence', 2000000);
    await renderHome();

    await screen.findByText('Omra');
    expect(screen.getByText('Voiture')).toBeTruthy();
    expect(screen.queryByText('Urgence')).toBeNull();
  });

  it('opens the full list from "Voir tout"', async () => {
    await seed();
    await addGoal('Omra', 1000000);
    await renderHome();

    // The transactions section has a "Voir tout" too; the goals one comes first in the tree.
    await screen.findByText('Omra');
    await fireEvent.press(screen.getAllByText(fr.home.seeAll)[0]);

    expect(await screen.findByText(fr.vaultsScreen.title)).toBeTruthy();
  });

  it('opens the full list when a goal card is tapped', async () => {
    await seed();
    await addGoal('Omra', 1000000);
    await renderHome();

    await fireEvent.press(await screen.findByText('Omra'));

    expect(await screen.findByText(fr.vaultsScreen.title)).toBeTruthy();
  });

  it('comes back to the dashboard', async () => {
    await seed();
    await addGoal('Omra', 1000000);
    await renderHome();
    await fireEvent.press(await screen.findByText('Omra'));
    await screen.findByText(fr.vaultsScreen.title);

    await fireEvent.press(screen.getByLabelText(fr.a11y.back));

    expect(await screen.findByText(fr.home.goalsTitle)).toBeTruthy();
  });

  describe('no goals yet', () => {
    /**
     * The section used to vanish entirely, which left a household that had never saved with no way
     * to discover goals at all.
     */
    it('keeps the section and invites a first goal', async () => {
      await seed();
      await renderHome();

      expect(await screen.findByText(fr.home.goalsTitle)).toBeTruthy();
      expect(screen.getByText(fr.home.goalsEmpty)).toBeTruthy();
      expect(screen.getByText(fr.home.goalsEmptyCta)).toBeTruthy();
    });

    it('offers no "Voir tout" when there is nothing to see', async () => {
      await seed();
      await renderHome();

      await screen.findByText(fr.home.goalsEmpty);
      // The transactions section has its own "Voir tout"; the goals one must not add a second.
      expect(screen.queryByText(fr.home.seeAll)).toBeNull();
    });

    it('opens the goals screen from the invitation', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByText(fr.home.goalsEmptyCta));

      expect(await screen.findByText(fr.vaultsScreen.title)).toBeTruthy();
    });
  });
});
