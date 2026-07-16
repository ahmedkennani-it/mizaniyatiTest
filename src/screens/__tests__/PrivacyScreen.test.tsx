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
import { getUserSettings, saveLanguageCountry } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { en } from '../../i18n/locales/en';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { ColorScheme } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { PrivacyScreen } from '../PrivacyScreen';

async function renderPrivacy(
  { onAccepted = jest.fn(), onOpenPolicy = jest.fn() } = {},
  { language = 'fr', scheme = 'light' as ColorScheme, senior = false } = {},
) {
  await i18n.changeLanguage(language);
  await render(
    <SafeAreaProvider>
      <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
        <PrivacyScreen onAccepted={onAccepted} onOpenPolicy={onOpenPolicy} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { onAccepted, onOpenPolicy };
}

/** The privacy step writes onto the row the language & country step created. */
async function seedSettings() {
  await saveLanguageCountry(mockFakeDb, {
    languageCode: 'fr',
    countryCode: 'MA',
    currencyCode: 'MAD',
  });
}

describe('PrivacyScreen (US-004)', () => {
  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await seedSettings();
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('lists the three commitments', async () => {
    await renderPrivacy();

    expect(screen.getByText(fr.privacy.commitmentBankTitle)).toBeTruthy();
    expect(screen.getByText(fr.privacy.commitmentDeviceTitle)).toBeTruthy();
    expect(screen.getByText(fr.privacy.commitmentFamilyTitle)).toBeTruthy();
  });

  it('spells out that entry is manual and no money is taken', async () => {
    await renderPrivacy();

    const note = screen.getByText(fr.privacy.manualEntryNote);
    expect(note).toBeTruthy();
    expect(fr.privacy.manualEntryNote).toMatch(/manuel/i);
    expect(fr.privacy.manualEntryNote).toMatch(/prélèvement/i);
  });

  it('offers the full policy', async () => {
    const { onOpenPolicy } = await renderPrivacy();

    await fireEvent.press(screen.getByText(fr.privacy.policyLink));
    expect(onOpenPolicy).toHaveBeenCalledTimes(1);
  });

  describe('accepting', () => {
    it('timestamps the acceptance and moves on', async () => {
      const before = Date.now();
      const { onAccepted } = await renderPrivacy();

      await fireEvent.press(screen.getByText(fr.privacy.acceptButton));

      expect(onAccepted).toHaveBeenCalledTimes(1);
      const settings = await getUserSettings(mockFakeDb);
      expect(settings?.privacyAcceptedAt).toEqual(expect.any(String));
      expect(new Date(settings!.privacyAcceptedAt!).getTime()).toBeGreaterThanOrEqual(before);
      expect(settings?.onboardingStep).toBe('privacy');
    });

    it('stores nothing before the button is pressed', async () => {
      await renderPrivacy();
      expect((await getUserSettings(mockFakeDb))?.privacyAcceptedAt).toBeNull();
    });
  });

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)('renders in %s', async (language, catalog) => {
    await renderPrivacy({}, { language });

    expect(screen.getByText(catalog.privacy.commitmentBankTitle)).toBeTruthy();
    expect(screen.getByText(catalog.privacy.manualEntryNote)).toBeTruthy();
    expect(screen.getByText(catalog.privacy.acceptButton)).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderPrivacy({}, { scheme, senior });
    expect(screen.getByText(fr.privacy.title)).toBeTruthy();
  });
});
