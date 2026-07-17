import React from 'react';
import { Pressable } from 'react-native';

import { Avatar } from './Avatar';
import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface MemberChipProps {
  name: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Vertical avatar+label chip for the member picker (US-018: "le membre connecté est
 * pré-sélectionné avec son avatar") — same shape as `CategoryChipV`, with an `Avatar` standing in
 * for the icon.
 */
export function MemberChip({ name, selected, onPress }: MemberChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
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
      <Avatar name={name} size={28} />
      <Txt
        size="xs"
        weight={selected ? 'semibold' : 'regular'}
        color={selected ? theme.colors.primaryText : theme.colors.textSecondary}
      >
        {name}
      </Txt>
    </Pressable>
  );
}
