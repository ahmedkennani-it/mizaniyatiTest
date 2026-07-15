import React from 'react';
import { View, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

const SIZE_TO_ICON: Record<NonNullable<IconTileProps['size']>, number> = {
  sm: 18,
  md: 20,
  lg: 26,
};

const SIZE_TO_BOX: Record<NonNullable<IconTileProps['size']>, number> = {
  sm: 34,
  md: 40,
  lg: 52,
};

export interface IconTileProps {
  icon: IconName;
  /** Accent family driving the wash background + icon tint. */
  accent?: AccentName;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

/**
 * The recurring atom of the design: a rounded square with an accent `wash` background and the icon
 * in the accent's `ink` tint (kept legible on the wash in both light and dark). Used everywhere a
 * category/section is represented — list rows, category budgets, stat tiles, goal cards.
 */
export function IconTile({ icon, accent = 'teal', size = 'md', style }: IconTileProps) {
  const { theme } = useTheme();
  const tone = theme.accents[accent];
  const box = SIZE_TO_BOX[size];

  return (
    <View
      style={[
        {
          width: box,
          height: box,
          borderRadius: theme.radius.md,
          backgroundColor: tone.wash,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon name={icon} size={SIZE_TO_ICON[size]} color={tone.ink} />
    </View>
  );
}
