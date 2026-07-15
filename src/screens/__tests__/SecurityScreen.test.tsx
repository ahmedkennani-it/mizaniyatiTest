import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import '../../i18n';

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
import {
  disableAppLock,
  disableBiometric,
  enableBiometric,
  getAppLockSettings,
  setPinLock,
} from '../../security/appLockSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { biometricClient } from '../../security/biometricClient';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { AppLockProvider } from '../../security';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { SecurityScreen } from '../SecurityScreen';

const mockGetAppLockSettings = getAppLockSettings as jest.Mock;
const mockSetPinLock = setPinLock as jest.Mock;
const mockEnableBiometric = enableBiometric as jest.Mock;
const mockDisableBiometric = disableBiometric as jest.Mock;
const mockDisableAppLock = disableAppLock as jest.Mock;
const mockHasHardware = biometricClient.hasHardware as jest.Mock;
const mockIsEnrolled = biometricClient.isEnrolled as jest.Mock;

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <ThemeProvider initialColorScheme="light">
      <AppLockProvider>
        <SecurityScreen onBack={onBack} />
      </AppLockProvider>
    </ThemeProvider>,
  );
}

describe('SecurityScreen (US-028)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppLockSettings.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
  });

  it('shows "no lock" as the current mode by default', async () => {
    await renderScreen();

    expect(await screen.findByText('Verrou actuel : Aucun verrou')).toBeTruthy();
  });

  it('sets a PIN and switches the current mode', async () => {
    mockSetPinLock.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockGetAppLockSettings
      .mockResolvedValueOnce({ mode: 'none', pinHash: null, pinSalt: null })
      .mockResolvedValueOnce({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '1234');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '1234');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(mockSetPinLock).toHaveBeenCalledWith('1234');
    expect(await screen.findByText('Verrou actuel : Code PIN')).toBeTruthy();
  });

  it('rejects a too-short PIN', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '12');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '12');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(await screen.findByText('Le code PIN doit contenir au moins 4 chiffres.')).toBeTruthy();
    expect(mockSetPinLock).not.toHaveBeenCalled();
  });

  it('rejects mismatched PIN confirmation', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '1234');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '9999');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(await screen.findByText('Les deux codes PIN ne correspondent pas.')).toBeTruthy();
    expect(mockSetPinLock).not.toHaveBeenCalled();
  });

  it('offers to enable biometric once a PIN is set and hardware is available', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();

    expect(await screen.findByText('Activer aussi la biométrie')).toBeTruthy();
  });

  it('does not offer biometric when no hardware is available', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockHasHardware.mockResolvedValue(false);

    await renderScreen();

    expect(await screen.findByText('Aucune biométrie disponible sur cet appareil.')).toBeTruthy();
    expect(screen.queryByText('Activer aussi la biométrie')).toBeNull();
  });

  it('enables biometric on top of the existing PIN', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockEnableBiometric.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Activer aussi la biométrie'));

    expect(mockEnableBiometric).toHaveBeenCalledTimes(1);
  });

  it('disables biometric, dropping back to pin mode', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    mockDisableBiometric.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Désactiver la biométrie'));

    expect(mockDisableBiometric).toHaveBeenCalledTimes(1);
  });

  it('disables the lock entirely', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockDisableAppLock.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Désactiver le verrou'));

    expect(mockDisableAppLock).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when the header back button is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    // Back is now the ScreenHeader's chevron (labelled "back" for a11y), not a "Retour" text link.
    await fireEvent.press(screen.getByLabelText('back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
