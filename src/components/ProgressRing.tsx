import React from 'react';
import { I18nManager, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Txt } from './Txt';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface ProgressRingProps {
  /** 0–1; clamped for the arc, but the raw value still drives `alertThreshold`. */
  progress: number;
  accent?: AccentName;
  /** 0–1. At or past it, the arc switches to the alert color (see `ProgressBar`). */
  alertThreshold?: number;
  alertColor?: string;
  /** Overrides the arc color outright — wins over `accent` and the threshold. */
  color?: string;
  size?: number;
  strokeWidth?: number;
  /** Big value in the middle (e.g. "78%"), preformatted by the caller. */
  centerValue?: string;
  /** Small caption under it. */
  centerLabel?: string;
  /** Read out in place of the ring itself, which is decorative to a screen reader. */
  accessibilityLabel?: string;
}

/**
 * Single-value progress ring (US-074b) — the circular counterpart of `ProgressBar`, for one figure
 * that deserves the space (a goal's completion, a category's share of its cap). `DonutBreakdown`
 * is the multi-segment sibling: use that to compare categories, this to track one against a target.
 *
 * The arc starts at 12 o'clock and sweeps toward the reading side (mirrored under RTL, like the
 * donut). The centered text sits in a sibling overlay, so it is never mirrored with the ring.
 */
export function ProgressRing({
  progress,
  accent = 'teal',
  alertThreshold,
  alertColor,
  color,
  size = 96,
  strokeWidth = 10,
  centerValue,
  centerLabel,
  accessibilityLabel,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const alerting = alertThreshold !== undefined && progress >= alertThreshold;
  const arcColor =
    color ?? (alerting ? (alertColor ?? theme.accents.coral.solid) : theme.accents[accent].solid);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = clamped * circumference;

  return (
    <View
      style={{ width: size, height: size }}
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel !== undefined ? 'progressbar' : undefined}
    >
      <Svg width={size} height={size} style={I18nManager.isRTL ? MIRRORED : undefined}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${arc} ${circumference - arc}`}
          />
        </G>
      </Svg>
      {centerValue || centerLabel ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            start: 0,
            end: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerValue ? (
            <Txt weight="bold" size="md">
              {centerValue}
            </Txt>
          ) : null}
          {centerLabel ? (
            <Txt size="xs" color={theme.colors.textSecondary}>
              {centerLabel}
            </Txt>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const MIRRORED = { transform: [{ scaleX: -1 as const }] };
