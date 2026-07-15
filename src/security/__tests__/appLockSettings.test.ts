const mockStore = new Map<string, string>();

// The real cryptoClient no-ops under Jest (see apps/mobile/CLAUDE.md), always returning an empty
// digest — that would make every PIN hash to the same value here. Fake it deterministically
// instead, varying with input, so "wrong PIN" tests are meaningful.
jest.mock('../cryptoClient', () => ({
  cryptoClient: {
    digestSha256Hex: jest.fn((value: string) => Promise.resolve(`digest(${value})`)),
    randomHex: jest.fn(() => Promise.resolve('deadbeef')),
  },
}));

jest.mock('../secureStoreClient', () => ({
  secureStoreClient: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve();
    }),
    deleteItem: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
  },
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../secureStoreClient', ...) above
import {
  disableAppLock,
  disableBiometric,
  enableBiometric,
  getAppLockSettings,
  setPinLock,
  verifyPin,
} from '../appLockSettings';

describe('appLockSettings', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('defaults to no lock when nothing has been saved', async () => {
    const settings = await getAppLockSettings();
    expect(settings).toEqual({ mode: 'none', pinHash: null, pinSalt: null });
  });

  it('sets a PIN and switches mode to pin', async () => {
    const settings = await setPinLock('1234');

    expect(settings.mode).toBe('pin');
    expect(settings.pinHash).toEqual(expect.any(String));
    expect(await getAppLockSettings()).toEqual(settings);
  });

  it('verifies a correct PIN', async () => {
    const settings = await setPinLock('1234');
    expect(await verifyPin('1234', settings)).toBe(true);
  });

  it('rejects an incorrect PIN', async () => {
    const settings = await setPinLock('1234');
    expect(await verifyPin('0000', settings)).toBe(false);
  });

  it('rejects any PIN when none has been set', async () => {
    expect(await verifyPin('1234', { mode: 'none', pinHash: null, pinSalt: null })).toBe(false);
  });

  it('requires a PIN to already be set before enabling biometric', async () => {
    await expect(enableBiometric()).rejects.toThrow(/requires a PIN/);
  });

  it('enables biometric on top of an existing PIN, keeping the same PIN', async () => {
    const pinSettings = await setPinLock('1234');

    const biometricSettings = await enableBiometric();

    expect(biometricSettings.mode).toBe('biometric');
    expect(biometricSettings.pinHash).toBe(pinSettings.pinHash);
  });

  it('verifies the same PIN still works after enabling biometric (fallback)', async () => {
    await setPinLock('1234');
    const settings = await enableBiometric();

    expect(await verifyPin('1234', settings)).toBe(true);
  });

  it('drops back to pin mode without losing the PIN', async () => {
    await setPinLock('1234');
    await enableBiometric();

    const settings = await disableBiometric();

    expect(settings.mode).toBe('pin');
    expect(await verifyPin('1234', settings)).toBe(true);
  });

  it('disables the lock entirely, clearing the PIN', async () => {
    await setPinLock('1234');

    const settings = await disableAppLock();

    expect(settings).toEqual({ mode: 'none', pinHash: null, pinSalt: null });
  });
});
