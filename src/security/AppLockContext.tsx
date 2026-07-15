import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getAppLockSettings, verifyPin } from './appLockSettings';
import type { AppLockSettings } from './appLockSettings';
import { biometricClient } from './biometricClient';

const NO_LOCK_SETTINGS: AppLockSettings = { mode: 'none', pinHash: null, pinSalt: null };

export interface AppLockContextValue {
  /** `true` until the persisted settings have been read once at startup. */
  loading: boolean;
  /** `true` when `mode !== 'none'` and the user hasn't unlocked yet this session. */
  locked: boolean;
  settings: AppLockSettings;
  unlockWithPin: (pin: string) => Promise<boolean>;
  /** `false` if biometric auth fails/is cancelled — caller falls back to the PIN field. */
  unlockWithBiometric: (promptMessage: string) => Promise<boolean>;
  /** Re-reads settings from storage — call after `setPinLock`/`enableBiometric`/etc. */
  refreshSettings: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState<AppLockSettings>(NO_LOCK_SETTINGS);

  useEffect(() => {
    getAppLockSettings().then((loaded) => {
      setSettings(loaded);
      setLocked(loaded.mode !== 'none');
      setLoading(false);
    });
  }, []);

  const refreshSettings = useCallback(async () => {
    const loaded = await getAppLockSettings();
    setSettings(loaded);
  }, []);

  const unlockWithPin = useCallback(
    async (pin: string) => {
      const ok = await verifyPin(pin, settings);
      if (ok) {
        setLocked(false);
      }
      return ok;
    },
    [settings],
  );

  const unlockWithBiometric = useCallback(async (promptMessage: string) => {
    const ok = await biometricClient.authenticate(promptMessage);
    if (ok) {
      setLocked(false);
    }
    return ok;
  }, []);

  const value: AppLockContextValue = {
    loading,
    locked,
    settings,
    unlockWithPin,
    unlockWithBiometric,
    refreshSettings,
  };

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
