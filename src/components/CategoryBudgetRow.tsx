import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { Icon } from './Icon';
import { IconTile } from './IconTile';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface CategoryBudgetRowProps {
  icon: IconName;
  accent?: AccentName;
  name: string;
  /** e.g. "3 200 / 2 950 MAD" (spent / cap), preformatted by the caller. */
  amountLabel: string;
  progress: number;
  /** Over the cap — turns the amount + bar red and shows an alert glyph instead of the %. */
  over?: boolean;
  /** Percentage tag (e.g. "95%"); ignored when `over`. */
  percentLabel?: string;
  onPress?: () => void;
}

/**
 * A category's monthly budget: IconTile + name + "spent / cap" + progress bar, with either a
 * percentage tag or, when `over`, a coral alert state (red amount, red bar, alert-circle glyph).
 * The amount comparison itself is done by the caller (integer spent vs. cap) — this only renders.
 */
export function CategoryBudgetRow({
  icon,
  accent = 'teal',
  name,
  amountLabel,
  progress,
  over = false,
  percentLabel,
  onPress,
}: CategoryBudgetRowProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const body = (
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <IconTile icon={icon} accent={accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="semibold" size="sm">
            {name}
          </Txt>
          <Txt
            size="xs"
            weight={over ? 'semibold' : 'regular'}
            color={over ? theme.accents.coral.solid : theme.colors.textSecondary}
          >
            {amountLabel}
          </Txt>
        </View>
        {over ? (
          <Icon
            name="alert-circle"
            size={18}
            color={theme.accents.coral.solid}
            accessibilityLabel={t('a11y.overBudget')}
          />
        ) : percentLabel ? (
          <Txt weight="bold" size="xs" color={theme.colors.textSecondary}>
            {percentLabel}
          </Txt>
        ) : null}
      </View>
      <ProgressBar
        progress={over ? 1 : progress}
        accent={accent}
        color={over ? theme.accents.coral.solid : undefined}
        style={{ marginTop: theme.spacing.sm }}
      />
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
