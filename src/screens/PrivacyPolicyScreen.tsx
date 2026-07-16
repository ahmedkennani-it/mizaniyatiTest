import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Card, ScreenHeader, Txt } from '../components';
import { useTheme } from '../theme';

export interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

/**
 * The full policy behind the onboarding step's link (US-004). It lives **in the app**, not behind
 * a URL: the product's whole claim is that nothing leaves the device, and sending the user to a
 * web page to read that would be a small contradiction of it — and would need a network call the
 * app deliberately doesn't make.
 *
 * The text states what the code actually does today (local SQLite, no network, no third party),
 * which is verifiable — `src/db/__tests__/offlineStorage.test.ts` fails if any source file so much
 * as calls `fetch`. It is **not** a lawyer-reviewed document; see `progress.md`.
 */
export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sections = [
    { titleKey: 'privacyPolicy.collectTitle', bodyKey: 'privacyPolicy.collectBody' },
    { titleKey: 'privacyPolicy.storageTitle', bodyKey: 'privacyPolicy.storageBody' },
    { titleKey: 'privacyPolicy.sharingTitle', bodyKey: 'privacyPolicy.sharingBody' },
    { titleKey: 'privacyPolicy.bankTitle', bodyKey: 'privacyPolicy.bankBody' },
    { titleKey: 'privacyPolicy.deletionTitle', bodyKey: 'privacyPolicy.deletionBody' },
  ];

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('privacyPolicy.title')} onBack={onBack} />

      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('privacyPolicy.intro')}
      </Txt>

      {sections.map((section) => (
        <Card key={section.titleKey} elevated style={{ gap: theme.spacing.xs }}>
          <Txt weight="semibold" size="sm">
            {t(section.titleKey)}
          </Txt>
          <View>
            <Txt size="xs" color={theme.colors.textSecondary}>
              {t(section.bodyKey)}
            </Txt>
          </View>
        </Card>
      ))}
    </AppScreen>
  );
}
