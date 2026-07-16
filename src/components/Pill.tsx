import React from 'react';
import { View, ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';

export interface PillProps {
  label: string;
  icon?: IconName;
  /** Background fill. Defaults to the teal wash. */
  background?: string;
  /** Text + icon color. Defaults to the teal ink. */
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Small rounded status/label pill (icon + text). Used for the trust chip, "NOUVEAU" badge, tontine
 * paid/pending status, and percentage tags. Colors are passed in so callers pick the right semantic
 * (success/danger/accent); defaults to the teal wash.
 */
export function Pill({ label, icon, background, color, style, testID }: PillProps) {
  const { theme } = useTheme();
  const fg = color ?? theme.accents.teal.ink;

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          backgroundColor: background ?? theme.accents.teal.wash,
          borderRadius: theme.radius.full,
          paddingVertical: 6,
          paddingHorizontal: 12,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Txt weight="semibold" size="xs" color={fg}>
        {label}
      </Txt>
    </View>
  );
}
