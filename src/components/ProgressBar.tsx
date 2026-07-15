import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface ProgressBarProps {
  /** 0–1; clamped. */
  progress: number;
  accent?: AccentName;
  /** Overridden fill color (e.g. danger when over budget) — wins over `accent`. */
  color?: string;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}

/**
 * Track + fill progress bar. The fill uses `alignSelf: flex-start`, so under `I18nManager.isRTL`
 * (Arabic) it grows from the right edge automatically — no manual left/right handling. Progress is
 * clamped to [0,1]; pass `color` (e.g. `theme.colors.danger`) to signal an over-budget state.
 */
export function ProgressBar({
  progress,
  accent = 'teal',
  color,
  height = 7,
  trackColor,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const fillColor = color ?? theme.accents[accent].solid;

  return (
    <View
      style={[
        {
          height,
          borderRadius: theme.radius.full,
          backgroundColor: trackColor ?? theme.colors.surfaceAlt,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: theme.radius.full,
          backgroundColor: fillColor,
          alignSelf: 'flex-start',
        }}
      />
    </View>
  );
}
