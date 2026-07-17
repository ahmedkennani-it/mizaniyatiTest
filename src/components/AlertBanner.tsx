import React from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';

export interface AlertBannerProps {
  message: string;
  /** Optional bold lead-in above the message, for a banner that must be scannable at a glance. */
  title?: string;
  icon?: IconName;
  /** `warning` uses the rose/coral tone (over-budget); `info` uses the teal wash. */
  tone?: 'warning' | 'info';
  /** Makes the whole banner tappable — e.g. "the concerned category's detail opens" (US-026). */
  onPress?: () => void;
}

/**
 * Inline banner for a single notable state (a category over its cap, a "your turn" tontine note).
 * `warning` renders the mockup's rose card; `info` the teal wash. Text wraps and stays readable in
 * both light and dark. The row mirrors under RTL automatically.
 */
export function AlertBanner({
  message,
  title,
  icon = 'alert-triangle',
  tone = 'warning',
  onPress,
}: AlertBannerProps) {
  const { theme } = useTheme();
  const isWarning = tone === 'warning';
  const palette = isWarning
    ? {
        bg: theme.banner.warningBg,
        border: theme.banner.warningBorder,
        icon: theme.accents.coral.solid,
        text: theme.banner.warningText,
      }
    : {
        bg: theme.accents.teal.wash,
        border: theme.accents.teal.wash,
        icon: theme.accents.teal.ink,
        text: theme.accents.teal.ink,
      };

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.sm + 2,
        paddingHorizontal: theme.spacing.md,
      }}
    >
      <Icon name={icon} size={20} color={palette.icon} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Txt size="xs" weight="bold" color={palette.text}>
            {title}
          </Txt>
        ) : null}
        <Txt size="xs" color={palette.text} style={{ lineHeight: theme.typography.sizes.xs * 1.45 }}>
          {message}
        </Txt>
      </View>
    </Wrapper>
  );
}
