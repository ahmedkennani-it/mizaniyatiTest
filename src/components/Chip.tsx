import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A tappable pill used for single-choice pickers (category/member/type, category icon/color). */
export function Chip({ label, selected, onPress }: ChipProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          minHeight: theme.minTouchTarget,
        },
      ]}
    >
      <Txt
        size="sm"
        weight={selected ? 'semibold' : 'regular'}
        color={selected ? theme.colors.primaryText : theme.colors.textPrimary}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
