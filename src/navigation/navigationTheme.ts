import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';

import type { Theme } from '../theme';

/** Maps our design-system `Theme` (US-002) onto React Navigation's theme shape. */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.colorScheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
    },
  };
}
