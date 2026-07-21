import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { useExpenseEntry } from '../screens/ExpenseEntryProvider';
import { useTheme } from '../theme';

/** Tab routes gated behind a Pro entitlement — the tab badges a lock rather than disappearing
 * (US-068's "visible mais verrouillée"); tapping still opens the tab, whose own screen redirects to
 * the paywall (or shows preserved data read-only, per the same US). */
const TAB_ENTITLEMENT_KEYS: Partial<Record<string, 'tontine'>> = {
  tontine: 'tontine',
};

const TAB_ICONS: Record<string, IconName> = {
  home: 'house',
  categories: 'layout-grid',
  tontine: 'handshake',
  transfers: 'plane',
  profile: 'user',
};

/**
 * Custom floating tab bar matching the mockup: a raised surface bar with the four tab items and a
 * central gradient FAB (the "+") that opens the global expense-entry sheet (`useExpenseEntry`) from
 * any tab. The FAB is inserted in the visual middle of the row.
 *
 * Order is driven by the language context's `isRTL`, not the native `I18nManager.isRTL` — the latter
 * only takes effect after an app restart (see `LanguageContext`), so relying on it here (or on
 * `flexDirection: 'row'`'s automatic RTL mirroring) left the bar's visual order out of sync with the
 * live language for the rest of the session: tabs stayed in their old position while everything else
 * (translated labels, `focused` state) moved on, so a tap on what looked like "Accueil" could land on
 * whatever tab actually occupied that stale slot. `direction: 'ltr'` on the row below opts the
 * container out of native mirroring so this manual reorder is the only thing moving the tabs.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { openEntry } = useExpenseEntry();
  const entitlements = useEntitlements();
  const { isRTL: rtl } = useLanguage();

  const orderedRoutes = rtl ? [...state.routes].reverse() : state.routes;

  const items = orderedRoutes.map((route) => {
    const index = state.routes.indexOf(route);
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
        // 44pt minimum, 56 in senior mode — the bar's own targets, not just the header's.
        style={{
          flex: 1,
          minHeight: theme.minTouchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingVertical: 6,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Icon
            name={TAB_ICONS[route.name] ?? 'house'}
            size={21}
            color={focused ? theme.colors.primary : theme.colors.textSecondary}
          />
          {TAB_ENTITLEMENT_KEYS[route.name] && !entitlements.can(TAB_ENTITLEMENT_KEYS[route.name]!) ? (
            <View style={{ position: 'absolute', top: -4, end: -6 }}>
              <Icon
                name="lock"
                size={11}
                color={theme.colors.textSecondary}
                accessibilityLabel={t('a11y.proLocked')}
              />
            </View>
          ) : null}
        </View>
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
      style={{ width: 64, minHeight: theme.minTouchTarget, alignItems: 'center' }}
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
          shadowColor: theme.shadows.primary,
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
      testID="tab-bar"
      style={{
        position: 'absolute',
        start: 0,
        end: 0,
        bottom: 0,
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        // Order already reflects `rtl` above — opt this row out of native RTL auto-mirroring so it
        // isn't flipped a second time by a stale `I18nManager.isRTL`.
        direction: 'ltr',
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
