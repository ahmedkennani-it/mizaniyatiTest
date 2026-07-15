import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Txt } from './Txt';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface DonutSegment {
  label: string;
  /** Numeric weight (spent amount) driving the arc length. */
  value: number;
  /** Preformatted amount shown in the legend. */
  valueLabel: string;
  accent: AccentName;
}

export interface DonutBreakdownProps {
  segments: DonutSegment[];
  /** Centered small label (e.g. "Dépensé"). */
  centerLabel: string;
  /** Centered value (e.g. "11 240"). */
  centerValue: string;
  /** Centered sub-label (e.g. currency code). */
  centerSubLabel?: string;
  size?: number;
}

/**
 * Spending-by-category donut (react-native-svg) + legend. Arc lengths are proportional to each
 * segment's `value`; the ring starts at 12 o'clock. The legend lists a colored dot, the category
 * label, and its preformatted amount. Purely presentational — the caller does the grouping/summing
 * (see `computeCategoryBreakdown`). Renders nothing meaningful for an all-zero total (guarded).
 */
export function DonutBreakdown({
  segments,
  centerLabel,
  centerValue,
  centerSubLabel,
  size = 130,
}: DonutBreakdownProps) {
  const { theme } = useTheme();
  const strokeWidth = 19;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let offset = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} originX={size / 2} originY={size / 2}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.surfaceAlt}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {total > 0 &&
              segments.map((segment, index) => {
                const fraction = Math.max(0, segment.value) / total;
                const arc = fraction * circumference;
                const dash = `${arc} ${circumference - arc}`;
                const circle = (
                  <Circle
                    key={`${segment.label}-${index}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.accents[segment.accent].solid}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={dash}
                    strokeDashoffset={-offset}
                  />
                );
                offset += arc;
                return circle;
              })}
          </G>
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt size="xs" color={theme.colors.textSecondary}>
            {centerLabel}
          </Txt>
          <Txt weight="bold" size="lg">
            {centerValue}
          </Txt>
          {centerSubLabel ? (
            <Txt size="xs" color={theme.colors.textSecondary}>
              {centerSubLabel}
            </Txt>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1, gap: theme.spacing.sm }}>
        {segments.map((segment, index) => (
          <View
            key={`${segment.label}-legend-${index}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
          >
            <View
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                backgroundColor: theme.accents[segment.accent].solid,
              }}
            />
            <Txt size="xs" color={theme.colors.textSecondary} style={{ flex: 1 }}>
              {segment.label}
            </Txt>
            <Txt weight="semibold" size="xs">
              {segment.valueLabel}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
