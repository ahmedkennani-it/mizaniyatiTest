import React from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface MonthSelectorProps {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * Centered month pill with prev/next chevrons. The chevrons use the shared `Icon` (which mirrors
 * directional glyphs under RTL), and the row itself mirrors, so "previous" stays on the reading
 * start side in both directions. Handlers are optional (the pill also reads fine as a static label).
 */
export function MonthSelector({ label, onPrev, onNext }: MonthSelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.full,
          paddingVertical: 7,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="previous-month" onPress={onPrev}>
          <Icon name="chevron-left" size={17} color={theme.colors.textSecondary} />
        </Pressable>
        <Txt weight="semibold" size="sm">
          {label}
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="next-month" onPress={onNext}>
          <Icon name="chevron-right" size={17} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
