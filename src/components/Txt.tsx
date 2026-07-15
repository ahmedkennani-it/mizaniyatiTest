import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

import { useAppFont, useTheme } from '../theme';
import type { FontWeightName, TypographySizes } from '../theme';

type SizeToken = keyof TypographySizes;

const WEIGHT_TO_RN: Record<FontWeightName, TextStyle> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extrabold: { fontWeight: '800' },
};

export interface TxtProps extends TextProps {
  /** Type-scale token (`xs`…`xxl`, senior-scaled) or an explicit pixel size. */
  size?: SizeToken | number;
  weight?: FontWeightName;
  /** Defaults to `theme.colors.textPrimary`. */
  color?: string;
}

/**
 * The app's single text primitive: applies the active-language font family (via `useAppFont`), the
 * themed type scale, weight, and color, so no screen hardcodes a `fontFamily`/`fontSize`. Renders a
 * plain RN `Text` with its children intact, so `getByText`/`findByText` keep working in tests.
 * Pairs the custom font family with the matching numeric `fontWeight` so the correct face is picked
 * on platforms that select by weight as well as those that select by family name.
 */
export function Txt({ size = 'md', weight = 'regular', color, style, ...rest }: TxtProps) {
  const { theme } = useTheme();
  const font = useAppFont();
  const fontSize = typeof size === 'number' ? size : theme.typography.sizes[size];

  return (
    <Text
      style={[
        { fontFamily: font[weight], fontSize, color: color ?? theme.colors.textPrimary },
        WEIGHT_TO_RN[weight],
        style,
      ]}
      {...rest}
    />
  );
}
