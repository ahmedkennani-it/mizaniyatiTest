import React from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface SectionHeaderProps {
  title: string;
  /** Optional trailing action (e.g. "Voir tout"). */
  actionLabel?: string;
  onActionPress?: () => void;
}

/** Section title with an optional right-aligned text action ("Voir tout" / "عرض الكل"). */
export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt weight="semibold" size="md">
        {title}
      </Txt>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onActionPress}>
          <Txt weight="semibold" size="sm" color={theme.colors.primary}>
            {actionLabel}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
