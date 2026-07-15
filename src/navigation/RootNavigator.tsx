import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from './FloatingTabBar';
import { CategoriesScreen, HomeScreen, ProfileScreen, TontineScreen } from '../screens';
import { useTheme } from '../theme';

export type RootTabParamList = {
  home: undefined;
  categories: undefined;
  tontine: undefined;
  profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Bottom-tab shell (Accueil/Catégories/Tontine/Profil) rendered through the custom
 * `FloatingTabBar` (floating surface bar + center gradient FAB). React Navigation still reorders the
 * tabs for RTL from `I18nManager.isRTL`; the FAB opens the global expense-entry sheet. The bar is
 * absolutely positioned, so tab screens add bottom padding (`AppScreen bottomInset`) to clear it.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen
        name="categories"
        component={CategoriesScreen}
        options={{ tabBarLabel: t('nav.categories') }}
      />
      <Tab.Screen
        name="tontine"
        component={TontineScreen}
        options={{ tabBarLabel: t('nav.tontine') }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}
