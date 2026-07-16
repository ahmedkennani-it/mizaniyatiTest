import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface ProgressBarProps {
  /** 0–1; clamped. */
  progress: number;
  accent?: AccentName;
  /**
   * 0–1. At or past it, the fill switches to the alert color on its own — so a caller passing a
   * cap doesn't also have to compute and pass the color for the over-budget state (US-074b).
   */
  alertThreshold?: number;
  /** Fill color once `alertThreshold` is reached. Defaults to the coral accent. */
  alertColor?: string;
  /** Overrides the fill color outright — wins over `accent` *and* over the threshold. */
  color?: string;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Track + fill progress bar. The fill uses `alignSelf: flex-start`, so under `I18nManager.isRTL`
 * (Arabic) it grows from the right edge automatically — no manual left/right handling. Progress is
 * clamped to [0,1]. Pass `alertThreshold` to have the bar color itself when it crosses that mark,
 * or `color` to drive the fill entirely from the caller.
 */
export function ProgressBar({
  progress,
  accent = 'teal',
  alertThreshold,
  alertColor,
  color,
  height = 7,
  trackColor,
  style,
  testID,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const alerting = alertThreshold !== undefined && progress >= alertThreshold;
  const fillColor =
    color ?? (alerting ? (alertColor ?? theme.accents.coral.solid) : theme.accents[accent].solid);

  return (
    <View
      testID={testID}
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
