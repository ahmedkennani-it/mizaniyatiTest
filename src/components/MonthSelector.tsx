import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface MonthSelectorProps {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  /** Greys out and disables the "next" chevron — e.g. at the current month (US-008). */
  disableNext?: boolean;
  disablePrev?: boolean;
}

/**
 * Centered month pill with prev/next chevrons. The chevrons use the shared `Icon` (which mirrors
 * directional glyphs under RTL), and the row itself mirrors, so "previous" stays on the reading
 * start side in both directions. Handlers are optional (the pill also reads fine as a static label).
 *
 * A disabled chevron is dimmed **and** reported as disabled to assistive tech, rather than merely
 * doing nothing: a control that looks pressable but silently ignores the press is worse than one
 * that says it is unavailable.
 */
export function MonthSelector({
  label,
  onPrev,
  onNext,
  disableNext = false,
  disablePrev = false,
}: MonthSelectorProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const chevronColor = (disabled: boolean) =>
    disabled ? theme.colors.textTertiary : theme.colors.textSecondary;

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('a11y.previousMonth')}
          accessibilityState={{ disabled: disablePrev }}
          disabled={disablePrev}
          onPress={onPrev}
          // A bare 17px chevron is well under the 44px minimum touch target.
          hitSlop={14}
        >
          <Icon name="chevron-left" size={17} color={chevronColor(disablePrev)} />
        </Pressable>
        <Txt weight="semibold" size="sm">
          {label}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('a11y.nextMonth')}
          accessibilityState={{ disabled: disableNext }}
          disabled={disableNext}
          onPress={onNext}
          hitSlop={14}
        >
          <Icon name="chevron-right" size={17} color={chevronColor(disableNext)} />
        </Pressable>
      </View>
    </View>
  );
}
