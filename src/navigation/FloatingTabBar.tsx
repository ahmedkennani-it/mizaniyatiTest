import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import { useExpenseEntry } from '../screens/ExpenseEntryProvider';
import { useTheme } from '../theme';

const TAB_ICONS: Record<string, IconName> = {
  home: 'house',
  categories: 'layout-grid',
  tontine: 'handshake',
  profile: 'user',
};

/**
 * Custom floating tab bar matching the mockup: a raised surface bar with the four tab items and a
 * central gradient FAB (the "+") that opens the global expense-entry sheet (`useExpenseEntry`) from
 * any tab. The FAB is inserted in the visual middle of the row. React Navigation already reorders
 * the tabs for RTL from `I18nManager.isRTL`; the FAB stays centered either way.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { openEntry } = useExpenseEntry();
  const rtl = I18nManager.isRTL;

  const items = state.routes.map((route, index) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
        onPress={onPress}
        style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 }}
      >
        <Icon
          name={TAB_ICONS[route.name] ?? 'house'}
          size={21}
          color={focused ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Txt
          size="xs"
          weight={focused ? 'semibold' : 'regular'}
          color={focused ? theme.colors.primary : theme.colors.textSecondary}
        >
          {label}
        </Txt>
      </Pressable>
    );
  });

  // Insert the FAB slot in the middle of the tab row.
  const midpoint = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);

  const fab = (
    <Pressable
      key="fab"
      accessibilityRole="button"
      accessibilityLabel={t('nav.addTransaction')}
      onPress={() => openEntry()}
      style={{ width: 64, alignItems: 'center' }}
    >
      <LinearGradient
        colors={theme.gradients.fab as [string, string, ...string[]]}
        start={{ x: rtl ? 1 : 0, y: 0 }}
        end={{ x: rtl ? 0 : 1, y: 1 }}
        style={{
          width: 58,
          height: 58,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -26,
          shadowColor: '#0D9488',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Icon name="plus" size={28} color={theme.colors.primaryText} />
      </LinearGradient>
    </Pressable>
  );

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}
    >
      {leftItems}
      {fab}
      {rightItems}
    </View>
  );
}
