import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

jest.mock('../appLockSettings', () => ({
  getAppLockSettings: jest.fn(),
  verifyPin: jest.fn(),
}));

jest.mock('../biometricClient', () => ({
  biometricClient: { authenticate: jest.fn() },
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { getAppLockSettings, verifyPin } from '../appLockSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { biometricClient } from '../biometricClient';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { AppLockProvider, useAppLock } from '../AppLockContext';

const mockGetAppLockSettings = getAppLockSettings as jest.Mock;
const mockVerifyPin = verifyPin as jest.Mock;
const mockAuthenticate = biometricClient.authenticate as jest.Mock;

function Probe() {
  const { loading, locked, settings, unlockWithPin, unlockWithBiometric } = useAppLock();
  return (
    <>
      <Text>{`loading:${loading}`}</Text>
      <Text>{`locked:${locked}`}</Text>
      <Text>{`mode:${settings.mode}`}</Text>
      <Pressable onPress={() => unlockWithPin('1234')}>
        <Text>try-pin</Text>
      </Pressable>
      <Pressable onPress={() => unlockWithBiometric('prompt')}>
        <Text>try-biometric</Text>
      </Pressable>
    </>
  );
}

describe('AppLockProvider / useAppLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts unlocked when mode is none', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );

    expect(await screen.findByText('loading:false')).toBeTruthy();
    expect(screen.getByText('locked:false')).toBeTruthy();
  });

  it('starts locked when a PIN is configured', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );

    expect(await screen.findByText('locked:true')).toBeTruthy();
  });

  it('unlocks on a correct PIN', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockVerifyPin.mockResolvedValue(true);

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );
    await screen.findByText('locked:true');

    await fireEvent.press(screen.getByText('try-pin'));

    expect(await screen.findByText('locked:false')).toBeTruthy();
  });

  it('stays locked on an incorrect PIN', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockVerifyPin.mockResolvedValue(false);

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );
    await screen.findByText('locked:true');

    await fireEvent.press(screen.getByText('try-pin'));

    expect(screen.getByText('locked:true')).toBeTruthy();
  });

  it('unlocks on successful biometric auth', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    mockAuthenticate.mockResolvedValue(true);

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );
    await screen.findByText('locked:true');

    await fireEvent.press(screen.getByText('try-biometric'));

    expect(await screen.findByText('locked:false')).toBeTruthy();
  });

  it('stays locked when biometric auth fails (falls back to PIN)', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    mockAuthenticate.mockResolvedValue(false);
    mockVerifyPin.mockResolvedValue(true);

    await render(
      <AppLockProvider>
        <Probe />
      </AppLockProvider>,
    );
    await screen.findByText('locked:true');

    await fireEvent.press(screen.getByText('try-biometric'));
    expect(screen.getByText('locked:true')).toBeTruthy();

    await fireEvent.press(screen.getByText('try-pin'));
    expect(await screen.findByText('locked:false')).toBeTruthy();
  });

  it('throws when useAppLock is called outside an AppLockProvider', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Probe />)).rejects.toThrow(
      'useAppLock must be used within an AppLockProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
