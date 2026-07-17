import React from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import { useTheme } from '../theme';
import { shadowColors } from '../theme/tokens';

export interface UndoBannerProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Floating confirmation that something was just removed, with a way to bring it back — the
 * timed half of "confirmation demandée + Annuler pendant 5 secondes" (US-024). The 5s timeout
 * itself lives with the caller (it decides how long the banner stays mounted); this component
 * only renders the message and the action.
 */
export function UndoBanner({ message, actionLabel, onAction }: UndoBannerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        shadowColor: shadowColors.neutral,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <Icon name="check-circle" size={18} color={theme.colors.primary} />
      <Txt size="sm" style={{ flex: 1 }}>
        {message}
      </Txt>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        hitSlop={8}
        style={{ minHeight: theme.minTouchTarget, justifyContent: 'center' }}
      >
        <Txt size="sm" weight="bold" color={theme.colors.primary}>
          {actionLabel}
        </Txt>
      </Pressable>
    </View>
  );
}
