import { useTranslation } from 'react-i18next';

import { AlertBanner, AppScreen, ScreenHeader, Txt } from '../components';
import { useTheme } from '../theme';

export interface SignInScreenProps {
  onBack: () => void;
}

/**
 * Destination of the welcome screen's "J'ai déjà un compte" (US-001). Signing in only means
 * anything once there is a backup to restore from, which is US-071a/b's opt-in encrypted backup
 * (phase 17) — so this states that plainly instead of showing credential fields that could not
 * lead anywhere. US-006 fills it in once that exists.
 */
export function SignInScreen({ onBack }: SignInScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('signIn.title')} onBack={onBack} />
      <AlertBanner tone="info" icon="shield-check" message={t('signIn.unavailableMessage')} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('signIn.localOnlyNote')}
      </Txt>
    </AppScreen>
  );
}
