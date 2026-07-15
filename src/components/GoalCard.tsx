import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { Card } from './Card';
import { IconTile } from './IconTile';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface GoalCardProps {
  icon: IconName;
  accent?: AccentName;
  title: string;
  progress: number;
  /** e.g. "13 500 / 30 000 MAD". */
  caption: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Savings-goal / vault card: IconTile, title, progress bar, "saved / target" caption. */
export function GoalCard({ icon, accent = 'teal', title, progress, caption, onPress, style }: GoalCardProps) {
  const { theme } = useTheme();

  const body = (
    <Card elevated style={[{ gap: theme.spacing.sm }, style]}>
      <IconTile icon={icon} accent={accent} size="sm" />
      <Txt weight="semibold" size="sm">
        {title}
      </Txt>
      <ProgressBar progress={progress} accent={accent} height={6} />
      <Txt size="xs" color={theme.colors.textSecondary}>
        {caption}
      </Txt>
    </Card>
  );

  if (!onPress) {
    return <View>{body}</View>;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  );
}
