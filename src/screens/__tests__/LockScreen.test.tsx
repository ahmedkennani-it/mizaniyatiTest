import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';

jest.mock('../../security/appLockSettings', () => ({
  getAppLockSettings: jest.fn(),
  verifyPin: jest.fn(),
}));

jest.mock('../../security/biometricClient', () => ({
  biometricClient: { authenticate: jest.fn() },
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { getAppLockSettings, verifyPin } from '../../security/appLockSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { biometricClient } from '../../security/biometricClient';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { AppLockProvider } from '../../security';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { LockScreen } from '../LockScreen';

const mockGetAppLockSettings = getAppLockSettings as jest.Mock;
const mockVerifyPin = verifyPin as jest.Mock;
const mockAuthenticate = biometricClient.authenticate as jest.Mock;

function renderScreen() {
  return render(
    <ThemeProvider initialColorScheme="light">
      <AppLockProvider>
        <LockScreen />
      </AppLockProvider>
    </ThemeProvider>,
  );
}

describe('LockScreen (US-028)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the PIN field directly in pin mode', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();

    expect(await screen.findByLabelText('Code PIN')).toBeTruthy();
  });

  it('shows an error on an incorrect PIN, without crashing', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockVerifyPin.mockResolvedValue(false);

    await renderScreen();
    await fireEvent.changeText(await screen.findByLabelText('Code PIN'), '0000');
    await fireEvent.press(screen.getByText('Déverrouiller'));

    expect(await screen.findByText('Code PIN incorrect.')).toBeTruthy();
  });

  it('auto-prompts biometric in biometric mode and shows the PIN fallback link', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    mockAuthenticate.mockResolvedValue(false);

    await renderScreen();

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(await screen.findByLabelText('Code PIN')).toBeTruthy();
  });

  it('lets the user switch to PIN entry manually before the auto biometric prompt resolves', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    // Never resolves during this test, so the auto-triggered prompt on mount can't itself flip
    // showPinField — only the manual "use PIN instead" link should.
    mockAuthenticate.mockReturnValue(new Promise(() => {}));

    await renderScreen();

    await fireEvent.press(await screen.findByText('Utiliser mon code PIN'));

    expect(await screen.findByLabelText('Code PIN')).toBeTruthy();
  });
});
