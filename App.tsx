import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ensureAppReady, ensureMigrated, getDatabase, getUserSettings } from './src/db';
import { EntitlementsProvider } from './src/entitlements';
import { LanguageProvider, useLanguage } from './src/i18n';
import { RootNavigator, toNavigationTheme } from './src/navigation';
import { ExpenseEntryProvider, LockScreen, OnboardingFlow } from './src/screens';
import { AppLockProvider, useAppLock } from './src/security';
import { SubscriptionProvider, useSubscription } from './src/subscriptions';
import { ThemeProvider, useTheme } from './src/theme';

/** Bridges `useSubscription()`'s resolved plan into `EntitlementsProvider` — kept as its own
 * component so `useSubscription` (which needs `SubscriptionProvider` above it) isn't called
 * directly in `AppNavigation`. */
function EntitlementsGate({ children }: { children: ReactNode }) {
  const { plan } = useSubscription();
  return <EntitlementsProvider plan={plan}>{children}</EntitlementsProvider>;
}

function AppNavigation() {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { loading: lockLoading, locked } = useAppLock();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // Drives the Tontine/Transferts tab slot (US-013); `undefined` until settings load.
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);
  // Bundled Outfit (latin) + IBM Plex Sans Arabic (arabic) faces — the family names here must match
  // `fontFamilies` in `src/theme/tokens.ts`, which `Txt`/`useAppFont` reference. `useFonts` returns
  // `true` immediately under jest-expo (mocked), so tests don't stall on the font gate below.
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    // `getUserSettings` needs migrations applied first, but must run *before* `ensureAppReady`'s
    // default-categories/member seed — seeding in the device-detected language before the user
    // has chosen one (onboarding, US-023) would lock in the wrong language for a fresh install.
    ensureMigrated()
      .then(() => getUserSettings(getDatabase()))
      .then(async (settings) => {
        if (!settings) {
          setNeedsOnboarding(true);
          setReady(true);
          return;
        }
        setCountryCode(settings.countryCode);
        // A previously completed onboarding's language choice takes precedence over the
        // device-detected one `LanguageProvider` initializes with, so it persists across restarts.
        if (settings.languageCode !== language) {
          setLanguage(settings.languageCode);
        }
        await ensureAppReady(settings.languageCode);
        setReady(true);
      });
    // Only run once at startup: the DB/seed bootstrap doesn't need to rerun on language switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || lockLoading || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  if (needsOnboarding) {
    return <OnboardingFlow onComplete={() => setNeedsOnboarding(false)} />;
  }

  if (locked) {
    return <LockScreen />;
  }

  return (
    <SubscriptionProvider>
      <EntitlementsGate>
        <ExpenseEntryProvider>
          <NavigationContainer theme={toNavigationTheme(theme)}>
            <RootNavigator countryCode={countryCode} />
            <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
          </NavigationContainer>
        </ExpenseEntryProvider>
      </EntitlementsGate>
    </SubscriptionProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppLockProvider>
            <AppNavigation />
          </AppLockProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
