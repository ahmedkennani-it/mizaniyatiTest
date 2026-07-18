import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { buildTheme } from './buildTheme';
import type { ColorScheme, Theme } from './types';

/** `'system'` follows the OS setting live (US-059's "l'app peut le suivre automatiquement");
 *  `'light'`/`'dark'` are an explicit household override that ignores OS changes. */
export type ColorSchemePreference = ColorScheme | 'system';

export interface ThemeContextValue {
  theme: Theme;
  /** The *effective*, resolved scheme `theme` was built from — always `'light'` or `'dark'`,
   *  never `'system'`, so every existing light/dark check keeps working unchanged. */
  colorScheme: ColorScheme;
  /** What the household actually chose — `'system'` unless they've explicitly overridden it. */
  colorSchemePreference: ColorSchemePreference;
  seniorMode: boolean;
  setColorSchemePreference: (preference: ColorSchemePreference) => void;
  /** Toggles between an explicit light/dark override, based on the *current effective* scheme —
   *  from `'system'`, this picks the opposite of whatever the OS currently resolves to. */
  toggleColorScheme: () => void;
  setSeniorMode: (enabled: boolean) => void;
  toggleSeniorMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Pins an explicit scheme, bypassing OS live-following — mainly for tests/storybook-style
   *  previews. Omit to default to `'system'`. */
  initialColorScheme?: ColorScheme;
  initialSeniorMode?: boolean;
}

export function ThemeProvider({
  children,
  initialColorScheme,
  initialSeniorMode = false,
}: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const [colorSchemePreference, setColorSchemePreference] = useState<ColorSchemePreference>(
    initialColorScheme ?? 'system',
  );
  const [seniorMode, setSeniorMode] = useState(initialSeniorMode);

  const systemEffective: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const colorScheme: ColorScheme =
    colorSchemePreference === 'system' ? systemEffective : colorSchemePreference;

  const toggleColorScheme = useCallback(() => {
    setColorSchemePreference(colorScheme === 'light' ? 'dark' : 'light');
  }, [colorScheme]);

  const toggleSeniorMode = useCallback(() => {
    setSeniorMode((prev) => !prev);
  }, []);

  const theme = useMemo(() => buildTheme(colorScheme, seniorMode), [colorScheme, seniorMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorScheme,
      colorSchemePreference,
      seniorMode,
      setColorSchemePreference,
      toggleColorScheme,
      setSeniorMode,
      toggleSeniorMode,
    }),
    [theme, colorScheme, colorSchemePreference, seniorMode, toggleColorScheme, toggleSeniorMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
