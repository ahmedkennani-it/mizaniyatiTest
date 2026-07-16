import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from './FloatingTabBar';
import { DEFAULT_COUNTRY_CODE, resolveTabs } from '../market';
import type { TabName } from '../market';
import {
  CategoriesScreen,
  HomeScreen,
  ProfileScreen,
  TontineScreen,
  TransfersScreen,
} from '../screens';
import { useTheme } from '../theme';

export type RootTabParamList = {
  home: undefined;
  categories: undefined;
  tontine: undefined;
  transfers: undefined;
  profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_SCREENS: Record<TabName, React.ComponentType> = {
  home: HomeScreen,
  categories: CategoriesScreen,
  tontine: TontineScreen,
  transfers: TransfersScreen,
  profile: ProfileScreen,
};

export interface RootNavigatorProps {
  /** Market the household picked at onboarding; drives the Tontine/Transferts slot (US-013). */
  countryCode?: string;
}

/**
 * Bottom-tab shell rendered through the custom `FloatingTabBar` (floating surface bar + center
 * gradient FAB). Which tabs exist is a market and accessibility decision, not a layout one, so it
 * comes from `resolveTabs`: diaspora markets get Transferts where tontine markets get Tontine, and
 * senior mode drops to two large targets. React Navigation reorders the tabs for RTL from
 * `I18nManager.isRTL`; the FAB opens the global expense-entry sheet and stays centered either way.
 * The bar is absolutely positioned, so tab screens add bottom padding (`AppScreen bottomInset`).
 */
export function RootNavigator({ countryCode = DEFAULT_COUNTRY_CODE }: RootNavigatorProps) {
  const { t } = useTranslation();
  const { theme, seniorMode } = useTheme();
  const tabs = resolveTabs(countryCode, seniorMode);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab}
          name={tab}
          component={TAB_SCREENS[tab]}
          options={{ tabBarLabel: t(`nav.${tab}`) }}
        />
      ))}
    </Tab.Navigator>
  );
}
