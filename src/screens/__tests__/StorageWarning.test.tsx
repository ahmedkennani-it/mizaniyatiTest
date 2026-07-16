import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('../../security/appLockSettings', () => ({
  getAppLockSettings: jest.fn(),
  setPinLock: jest.fn(),
  enableBiometric: jest.fn(),
  disableBiometric: jest.fn(),
  disableAppLock: jest.fn(),
  verifyPin: jest.fn(),
}));

jest.mock('../../security/biometricClient', () => ({
  biometricClient: { hasHardware: jest.fn(), isEnrolled: jest.fn(), authenticate: jest.fn() },
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import i18n from '../../i18n/i18n';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { en } from '../../i18n/locales/en';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { AppLockProvider } from '../../security';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { getAppLockSettings } from '../../security/appLockSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { biometricClient } from '../../security/biometricClient';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { SecurityScreen } from '../SecurityScreen';

async function renderScreenIn(language: 'fr' | 'ar' | 'en') {
  await i18n.changeLanguage(language);
  await render(
    <ThemeProvider initialColorScheme="light">
      <AppLockProvider>
        <SecurityScreen onBack={jest.fn()} />
      </AppLockProvider>
    </ThemeProvider>,
  );
}

/**
 * US-070, last criterion: "étant donné une désinstallation sans sauvegarde, l'utilisateur est
 * prévenu de la perte définitive". The warning has to be its own visible banner — it used to be a
 * clause buried at the end of the forgotten-PIN note, where nobody reads it before uninstalling.
 */
describe('permanent data-loss warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAppLockSettings as jest.Mock).mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });
    (biometricClient.hasHardware as jest.Mock).mockResolvedValue(true);
    (biometricClient.isEnrolled as jest.Mock).mockResolvedValue(true);
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('warns that uninstalling erases everything, and says data is local-only', async () => {
    await renderScreenIn('fr');

    expect(await screen.findByText(fr.storage.uninstallWarningTitle)).toBeTruthy();
    expect(screen.getByText(fr.storage.uninstallWarning)).toBeTruthy();
    expect(screen.getByText(fr.storage.title)).toBeTruthy();
  });

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)('shows the same warning in %s', async (language, catalog) => {
    await renderScreenIn(language);

    expect(await screen.findByText(catalog.storage.uninstallWarningTitle)).toBeTruthy();
    expect(screen.getByText(catalog.storage.uninstallWarning)).toBeTruthy();
  });

  // The point of the criterion is "définitive": copy that only says "stocké localement" does not
  // tell a user that uninstalling costs them everything, so the wording itself is the deliverable.
  it('words the warning as an unrecoverable loss, not just a local-storage note', () => {
    expect(fr.storage.uninstallWarning).toMatch(/récupér|perdu/i);
    expect(en.storage.uninstallWarning).toMatch(/recover|lost/i);
  });
});
