import { hashPin, generateSalt } from './pinHash';
import { secureStoreClient } from './secureStoreClient';

export type AppLockMode = 'none' | 'pin' | 'biometric';

/**
 * `'biometric'` always has a PIN underneath it (`pinHash`/`pinSalt` are never cleared when
 * switching to biometric) — "Échec biométrie → repli PIN" (`docs/specs/securite-sauvegarde.md`'s
 * cas limite) needs something to fall back *to*. `enableBiometric` below enforces this by
 * requiring a PIN to already be set.
 */
export interface AppLockSettings {
  mode: AppLockMode;
  pinHash: string | null;
  pinSalt: string | null;
}

const STORAGE_KEY = 'mizaniyati.appLockSettings';

const DEFAULTS: AppLockSettings = { mode: 'none', pinHash: null, pinSalt: null };

export async function getAppLockSettings(): Promise<AppLockSettings> {
  const raw = await secureStoreClient.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULTS;
  }
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function saveAppLockSettings(settings: AppLockSettings): Promise<void> {
  await secureStoreClient.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Sets (or changes) the PIN and switches lock mode to `'pin'`. */
export async function setPinLock(pin: string): Promise<AppLockSettings> {
  const pinSalt = await generateSalt();
  const pinHash = await hashPin(pin, pinSalt);
  const settings: AppLockSettings = { mode: 'pin', pinHash, pinSalt };
  await saveAppLockSettings(settings);
  return settings;
}

/**
 * Switches to `'biometric'` mode. Requires a PIN to already be configured (call `setPinLock`
 * first) — biometric is an additional, faster unlock path on top of the PIN, never a replacement
 * for it, so there's always a fallback.
 */
export async function enableBiometric(): Promise<AppLockSettings> {
  const current = await getAppLockSettings();
  if (!current.pinHash || !current.pinSalt) {
    throw new Error('enableBiometric requires a PIN to already be set (setPinLock first).');
  }
  const settings: AppLockSettings = { ...current, mode: 'biometric' };
  await saveAppLockSettings(settings);
  return settings;
}

/** Drops back from `'biometric'` to plain `'pin'` mode, keeping the same PIN. */
export async function disableBiometric(): Promise<AppLockSettings> {
  const current = await getAppLockSettings();
  const settings: AppLockSettings = { ...current, mode: 'pin' };
  await saveAppLockSettings(settings);
  return settings;
}

export async function disableAppLock(): Promise<AppLockSettings> {
  await saveAppLockSettings(DEFAULTS);
  return DEFAULTS;
}

export async function verifyPin(pin: string, settings: AppLockSettings): Promise<boolean> {
  if (!settings.pinHash || !settings.pinSalt) {
    return false;
  }
  const candidateHash = await hashPin(pin, settings.pinSalt);
  return candidateHash === settings.pinHash;
}
