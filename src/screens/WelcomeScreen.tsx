import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, TrustChip, Txt } from '../components';
import { useTheme } from '../theme';

export interface WelcomeScreenProps {
  /** Starts the onboarding sequence at the language & country step. */
  onStart: () => void;
  /** Opens sign-in for a household that already has an account on another device. */
  onSignIn: () => void;
}

/**
 * First thing a new install shows (US-001): the mark, the app name, the pitch, and — above the
 * fold, before any scrolling — the "no bank connection" badge. That badge is the product's whole
 * premise for a user deciding whether to trust it with the family's money, so the layout keeps it
 * on the first screenful rather than in a scrolling list of features.
 */
export function WelcomeScreen({ onStart, onSignIn }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <AppScreen contentStyle={{ flex: 1, justifyContent: 'space-between', gap: theme.spacing.lg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
        <View
          testID="welcome-logo"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            backgroundColor: theme.accents.teal.solid,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt weight="bold" size={44} color={theme.onAccent.text}>
            م
          </Txt>
        </View>

        <Txt weight="extrabold" size="xxl" style={{ textAlign: 'center' }}>
          {t('welcome.appName')}
        </Txt>
        <Txt size="md" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
          {t('welcome.pitch')}
        </Txt>

        <TrustChip label={t('welcome.noBankBadge')} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('welcome.startButton')} size="lg" onPress={onStart} />
        <Pressable accessibilityRole="button" onPress={onSignIn} hitSlop={8}>
          <Txt
            weight="semibold"
            size="sm"
            color={theme.colors.primary}
            style={{ textAlign: 'center', paddingVertical: theme.spacing.sm }}
          >
            {t('welcome.signInLink')}
          </Txt>
        </Pressable>
      </View>
    </AppScreen>
  );
}
