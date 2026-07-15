import React from 'react';
import { View, ViewStyle } from 'react-native';

import { Txt } from './Txt';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface AvatarProps {
  /** Full name; the first character is shown. */
  name: string;
  size?: number;
  /** When set, uses the accent's solid fill; otherwise the brand primary. */
  accent?: AccentName;
  style?: ViewStyle;
}

/** Initial-letter avatar tile (household member / tontine participant / greeting header). */
export function Avatar({ name, size = 42, accent, style }: AvatarProps) {
  const { theme } = useTheme();
  const background = accent ? theme.accents[accent].solid : theme.colors.primary;
  const letter = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Txt weight="bold" color={theme.colors.primaryText} size={Math.round(size * 0.4)}>
        {letter}
      </Txt>
    </View>
  );
}
