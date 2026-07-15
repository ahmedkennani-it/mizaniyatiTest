import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { buildTheme } from './buildTheme';
import type { ColorScheme, Theme } from './types';

export interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  seniorMode: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  setSeniorMode: (enabled: boolean) => void;
  toggleSeniorMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Overrides the system color scheme; mainly useful for tests/storybook-style previews. */
  initialColorScheme?: ColorScheme;
  initialSeniorMode?: boolean;
}

export function ThemeProvider({
  children,
  initialColorScheme,
  initialSeniorMode = false,
}: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    initialColorScheme ?? (systemScheme === 'dark' ? 'dark' : 'light'),
  );
  const [seniorMode, setSeniorMode] = useState(initialSeniorMode);

  const toggleColorScheme = useCallback(() => {
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSeniorMode = useCallback(() => {
    setSeniorMode((prev) => !prev);
  }, []);

  const theme = useMemo(() => buildTheme(colorScheme, seniorMode), [colorScheme, seniorMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorScheme,
      seniorMode,
      setColorScheme,
      toggleColorScheme,
      setSeniorMode,
      toggleSeniorMode,
    }),
    [theme, colorScheme, seniorMode, toggleColorScheme, toggleSeniorMode],
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
