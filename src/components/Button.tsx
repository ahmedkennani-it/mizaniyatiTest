import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { I18nManager, Pressable, StyleProp, StyleSheet, View, ViewStyle, PressableProps } from 'react-native';

import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'gradient';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/**
 * Themed button. `gradient` renders the brand teal gradient with a soft shadow (primary CTAs like
 * "Commencer" / "Enregistrer"); `primary`/`secondary`/`danger` are solid fills. Label text goes
 * through `Txt` so it uses the active-language font. An optional leading `Icon` sits before the
 * label (the row mirrors under RTL). Sizes: `md` (default) / `lg` (taller onboarding & form CTAs).
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const palette = variantPalette(theme, variant);
  const paddingVertical = size === 'lg' ? 16 : 12;

  const content = (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={18} color={palette.text} /> : null}
      <Txt weight="bold" size="md" color={palette.text} style={{ textAlign: 'center' }}>
        {label}
      </Txt>
    </View>
  );

  const baseStyle: ViewStyle = {
    minHeight: theme.minTouchTarget,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical,
  };

  if (variant === 'gradient') {
    const rtl = I18nManager.isRTL;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, styles.shadow, style]}
        {...rest}
      >
        <LinearGradient
          colors={theme.gradients.fab as [string, string, ...string[]]}
          start={{ x: rtl ? 1 : 0, y: 0 }}
          end={{ x: rtl ? 0 : 1, y: 1 }}
          style={[styles.base, baseStyle]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        baseStyle,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'primary' ? styles.shadow : null,
        style,
      ]}
      {...rest}
    >
      {content}
    </Pressable>
  );
}

function variantPalette(theme: Theme, variant: ButtonVariant) {
  switch (variant) {
    case 'secondary':
      return {
        background: theme.colors.surfaceAlt,
        border: theme.colors.border,
        text: theme.colors.textPrimary,
      };
    case 'danger':
      return { background: theme.colors.danger, border: theme.colors.danger, text: '#FFFFFF' };
    case 'gradient':
      return { background: 'transparent', border: 'transparent', text: theme.colors.primaryText };
    case 'primary':
    default:
      return {
        background: theme.colors.primary,
        border: theme.colors.primary,
        text: theme.colors.primaryText,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Teal drop shadow for primary/gradient CTAs (reads best in light mode; harmless on dark).
  shadow: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
});
