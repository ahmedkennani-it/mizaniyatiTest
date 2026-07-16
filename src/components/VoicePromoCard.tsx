import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { I18nManager, Pressable, View } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import { useTheme } from '../theme';

export interface VoicePromoCardProps {
  title: string;
  subtitle: string;
  /** Small badge (e.g. "NOUVEAU" / "جديد"). */
  badge?: string;
  onPress?: () => void;
  /** Closes the banner for good. Without it there is no way to answer "no thanks" (US-014). */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Dark-gradient promo for voice entry: a teal mic tile, title + optional badge, a sample-phrase
 * subtitle, and a chevron toward the reading end. Mirrors under RTL (row + gradient direction).
 */
export function VoicePromoCard({
  title,
  subtitle,
  badge,
  onPress,
  onDismiss,
  dismissLabel,
}: VoicePromoCardProps) {
  const { theme } = useTheme();
  const rtl = I18nManager.isRTL;
  const colors = theme.gradients.voice as [string, string, ...string[]];

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <LinearGradient
        colors={colors}
        start={{ x: rtl ? 1 : 0, y: 0 }}
        end={{ x: rtl ? 0 : 1, y: 1 }}
        style={{
          borderRadius: theme.radius.lg + 4,
          padding: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm + 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.accents.teal.solid,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="mic" size={24} color={theme.onAccent.ink} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Txt weight="bold" size="sm" color={theme.onAccent.text}>
              {title}
            </Txt>
            {badge ? (
              <View
                style={{
                  backgroundColor: theme.accents.teal.solid,
                  borderRadius: theme.radius.full,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <Txt weight="extrabold" size={9} color={theme.onAccent.ink}>
                  {badge}
                </Txt>
              </View>
            ) : null}
          </View>
          <Txt size="xs" color={theme.onAccent.text}>
            {subtitle}
          </Txt>
        </View>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            hitSlop={12}
          >
            <Icon name="x" size={18} color={theme.onAccent.icon} />
          </Pressable>
        ) : (
          <Icon name="chevron-right" size={19} color={theme.onAccent.icon} />
        )}
      </LinearGradient>
    </Pressable>
  );
}
