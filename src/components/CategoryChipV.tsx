import React from 'react';
import { Pressable } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';

export interface CategoryChipVProps {
  icon: IconName;
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Vertical icon+label chip for the quick-entry category picker: teal fill when selected, muted
 * surface otherwise. Distinct from the horizontal `Chip` (single-line pill) — this stacks the icon
 * over the label for the scrollable category strip in `AddExpenseForm`.
 */
export function CategoryChipV({ icon, label, selected, onPress }: CategoryChipVProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      // Named explicitly: the icon above the label is decorative, and without this the chip's
      // accessible name is left to whatever the platform infers from the children.
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minWidth: 74,
        gap: 6,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: theme.radius.lg,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Icon
        name={icon}
        size={20}
        color={selected ? theme.colors.primaryText : theme.colors.textSecondary}
      />
      <Txt
        size="xs"
        weight={selected ? 'semibold' : 'regular'}
        color={selected ? theme.colors.primaryText : theme.colors.textSecondary}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
