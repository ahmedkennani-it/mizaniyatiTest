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
import {
  createHousehold,
  createMember,
  getUserSettings,
  recordVoiceEntry,
  saveLanguageCountry,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { VOICE_PROMO_USAGE_LIMIT } from '../../voice';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';

async function seed() {
  await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
  await createMember(mockFakeDb, { name: 'Youssef' });
  await saveLanguageCountry(mockFakeDb, {
    languageCode: 'fr',
    countryCode: 'MA',
    currencyCode: 'MAD',
  });
}

async function renderHome(plan?: Plan) {
  await render(
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider initialColorScheme="light">
          <EntitlementsProvider plan={plan}>
            <SubscriptionProvider>
              <ExpenseEntryProvider>
                <HomeScreen />
              </ExpenseEntryProvider>
            </SubscriptionProvider>
          </EntitlementsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('voice discovery banner (US-014)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  describe('never used voice', () => {
    it('shows the banner with its NOUVEAU tag and a sample phrase', async () => {
      await seed();
      await renderHome();

      expect(await screen.findByText(fr.home.voiceTitle)).toBeTruthy();
      expect(screen.getByText(fr.home.voiceBadge)).toBeTruthy();
      expect(screen.getByText(fr.home.voiceSubtitle)).toBeTruthy();
    });

    it('gives the sample phrase in the active language', async () => {
      await seed();
      await i18n.changeLanguage('ar');
      await renderHome();

      expect(await screen.findByText(ar.home.voiceSubtitle)).toBeTruthy();
      expect(screen.getByText(ar.home.voiceBadge)).toBeTruthy();
    });

    /** Voice entry is Pro-gated (US-020a/US-068) — a free household lands on the paywall with the
     *  voice row highlighted, not a live mic. */
    it('opens the paywall with the voice row highlighted when tapped on the free plan', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByText(fr.home.voiceTitle));

      expect(await screen.findByText(fr.paywallScreen.title)).toBeTruthy();
      expect(screen.getByTestId('paywall-row-voice').props.style).toMatchObject({ borderWidth: 2 });
    });

    it('opens the voice-capture sheet when tapped on the Pro plan', async () => {
      await seed();
      await renderHome(PRO_PLAN);

      await fireEvent.press(await screen.findByText(fr.home.voiceTitle));

      expect(await screen.findByText(fr.voiceCapture.explainerTitle)).toBeTruthy();
    });
  });

  describe('after enough use', () => {
    it.each([1, 2])('still shows after %s use', async (uses) => {
      await seed();
      for (let i = 0; i < uses; i += 1) {
        await recordVoiceEntry(mockFakeDb);
      }
      await renderHome();

      expect(await screen.findByText(fr.home.voiceTitle)).toBeTruthy();
    });

    it('retires once voice has been used three times', async () => {
      await seed();
      for (let i = 0; i < VOICE_PROMO_USAGE_LIMIT; i += 1) {
        await recordVoiceEntry(mockFakeDb);
      }
      await renderHome();

      await screen.findByText(fr.home.balanceLabel);
      expect(screen.queryByText(fr.home.voiceTitle)).toBeNull();
    });
  });

  describe('dismissing', () => {
    it('offers a way to say no thanks', async () => {
      await seed();
      await renderHome();

      expect(await screen.findByLabelText(fr.home.voiceDismiss)).toBeTruthy();
    });

    it('hides the banner and remembers the refusal', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByLabelText(fr.home.voiceDismiss));

      expect(await screen.findByText(fr.home.balanceLabel)).toBeTruthy();
      expect(screen.queryByText(fr.home.voiceTitle)).toBeNull();
      expect((await getUserSettings(mockFakeDb))?.voicePromoDismissed).toBe(true);
    });

    /** Persisted, so it stays gone on the next launch rather than only for this render. */
    it('stays gone on a fresh mount', async () => {
      await seed();
      await renderHome();
      await fireEvent.press(await screen.findByLabelText(fr.home.voiceDismiss));
      await screen.findByText(fr.home.balanceLabel);
      screen.unmount();

      await renderHome();

      await screen.findByText(fr.home.balanceLabel);
      expect(screen.queryByText(fr.home.voiceTitle)).toBeNull();
    });

    // Dismissing is not using: crediting the count would be a lie about what the household did.
    it('does not count as a use', async () => {
      await seed();
      await renderHome();

      await fireEvent.press(await screen.findByLabelText(fr.home.voiceDismiss));

      expect((await getUserSettings(mockFakeDb))?.voiceEntryCount).toBe(0);
    });
  });
});
