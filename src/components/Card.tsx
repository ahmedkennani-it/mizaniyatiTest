import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '../theme';

export interface CardProps extends ViewProps {
  /** Adds the design's soft drop shadow (used for raised cards like list/summary cards). */
  elevated?: boolean;
  /** Removes the 1px border (for cards that sit on their own colored fill). */
  borderless?: boolean;
}

export function Card({ style, children, elevated = false, borderless = false, ...rest }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: borderless ? 0 : 1,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        },
        elevated && theme.colorScheme === 'light' ? styles.shadow : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// Soft, low elevation matching the mockup's `0 14px 30px -22px rgba(15,23,42,.3)`. Only applied in
// light mode — shadows read as muddy on the dark surface, where the border carries separation.
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
});
