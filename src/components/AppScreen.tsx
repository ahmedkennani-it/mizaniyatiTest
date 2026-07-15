import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

export interface AppScreenProps {
  children: React.ReactNode;
  /** Wrap content in a vertical `ScrollView` (most screens). */
  scroll?: boolean;
  /** Apply the standard 22px horizontal / 16px vertical content padding. */
  padded?: boolean;
  /** Override the background (e.g. the Ramadan warm surface, or a full-bleed gradient screen). */
  background?: string;
  contentStyle?: ViewStyle;
  /** Extra bottom space so content clears the floating tab bar (dashboards/lists). */
  bottomInset?: number;
}

/**
 * Full-screen container: fills with the theme background, insets the top for the status bar/notch
 * (via safe-area), and optionally scrolls + pads its content. Replaces the mockup's decorative
 * "phone frame" (which only existed to preview screens on the design canvas). Every top-level screen
 * mounts inside one so background, safe area, and content rhythm stay consistent.
 */
export function AppScreen({
  children,
  scroll = false,
  padded = true,
  background,
  contentStyle,
  bottomInset = 0,
}: AppScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = background ?? theme.colors.background;

  const padding: ViewStyle = padded
    ? { paddingHorizontal: 22, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg + bottomInset }
    : { paddingBottom: bottomInset };

  if (scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[padding, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
    </View>
  );
}
