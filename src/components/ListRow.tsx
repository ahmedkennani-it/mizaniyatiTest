import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { Card } from './Card';
import { Icon } from './Icon';
import { IconTile } from './IconTile';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Category/section icon shown in a leading `IconTile`. Omit if you pass `leading`. */
  icon?: IconName;
  accent?: AccentName;
  /** Custom leading element (e.g. an `Avatar`) — overrides `icon`. */
  leading?: React.ReactNode;
  /** Right-aligned primary value (e.g. a formatted amount). */
  value?: string;
  valueColor?: string;
  /** Custom trailing element (status chip, chevron…) — overrides `value`. */
  trailing?: React.ReactNode;
  /** Shows a chevron pointing to the reading-direction end (nav rows). */
  chevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * The universal row: leading `IconTile` (or custom `Avatar`), title + optional subtitle, and a
 * right-aligned value or custom trailing node. `flexDirection: 'row'` mirrors automatically under
 * RTL. Reused for transactions, tontine payments, savings contributions, and profile nav links.
 * Wrapped in a `Pressable` only when `onPress` is set (otherwise a plain `Card`).
 */
export function ListRow({
  title,
  subtitle,
  icon,
  accent = 'teal',
  leading,
  value,
  valueColor,
  trailing,
  chevron = false,
  onPress,
  style,
}: ListRowProps) {
  const { theme } = useTheme();

  const body = (
    <Card
      elevated
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
        style,
      ]}
    >
      {leading ?? (icon ? <IconTile icon={icon} accent={accent} /> : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="semibold" size="sm">
          {title}
        </Txt>
        {subtitle ? (
          <Txt size="xs" color={theme.colors.textSecondary}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailing ??
        (value ? (
          <Txt weight="semibold" size="sm" color={valueColor}>
            {value}
          </Txt>
        ) : null)}
      {chevron ? (
        <Icon name="chevron-right" size={18} color={theme.colors.textSecondary} />
      ) : null}
    </Card>
  );

  if (!onPress) {
    return body;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  );
}
