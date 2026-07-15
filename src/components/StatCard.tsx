import React from 'react';
import { ViewStyle } from 'react-native';

import { Card } from './Card';
import { IconTile } from './IconTile';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface StatCardProps {
  icon: IconName;
  accent?: AccentName;
  label: string;
  value: string;
  style?: ViewStyle;
}

/** Small metric tile: IconTile on top, muted label, bold value. Used in the Ramadan grid, etc. */
export function StatCard({ icon, accent = 'teal', label, value, style }: StatCardProps) {
  const { theme } = useTheme();
  return (
    <Card elevated style={[{ gap: 4 }, style]}>
      <IconTile icon={icon} accent={accent} size="sm" />
      <Txt size="sm" color={theme.colors.textSecondary} style={{ marginTop: 6 }}>
        {label}
      </Txt>
      <Txt weight="bold" size="lg">
        {value}
      </Txt>
    </Card>
  );
}
