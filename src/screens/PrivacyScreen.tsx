import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AlertBanner, AppScreen, Button, Card, IconTile, Txt } from '../components';
import type { IconName } from '../components';
import { getDatabase } from '../db/client';
import { acceptPrivacy } from '../db/repositories';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface PrivacyScreenProps {
  /** Called once the acceptance is timestamped and stored. */
  onAccepted: () => void;
  onOpenPolicy: () => void;
}

interface Commitment {
  icon: IconName;
  accent: AccentName;
  titleKey: string;
  bodyKey: string;
}

const COMMITMENTS: Commitment[] = [
  { icon: 'ban', accent: 'coral', titleKey: 'privacy.commitmentBankTitle', bodyKey: 'privacy.commitmentBankBody' },
  { icon: 'smartphone', accent: 'teal', titleKey: 'privacy.commitmentDeviceTitle', bodyKey: 'privacy.commitmentDeviceBody' },
  { icon: 'users', accent: 'purple', titleKey: 'privacy.commitmentFamilyTitle', bodyKey: 'privacy.commitmentFamilyBody' },
];

/**
 * The zero-bank promise, made explicit before the household reaches the dashboard (US-004). The
 * three commitments are the product's premise, so they are stated as commitments rather than
 * buried in a policy nobody opens — the full text is one tap away for whoever wants it.
 *
 * Accepting **timestamps** the acceptance (`acceptPrivacy`): that is what separates a promise the
 * user acknowledged from one the app assumed.
 */
export function PrivacyScreen({ onAccepted, onOpenPolicy }: PrivacyScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    setSaving(true);
    await acceptPrivacy(getDatabase());
    onAccepted();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <View style={{ gap: theme.spacing.xs, paddingTop: theme.spacing.md }}>
        <Txt weight="extrabold" size="xl">
          {t('privacy.title')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('privacy.subtitle')}
        </Txt>
      </View>

      {COMMITMENTS.map((commitment) => (
        <Card key={commitment.titleKey} elevated style={{ gap: theme.spacing.sm }}>
          <IconTile icon={commitment.icon} accent={commitment.accent} />
          <Txt weight="semibold" size="sm">
            {t(commitment.titleKey)}
          </Txt>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t(commitment.bodyKey)}
          </Txt>
        </Card>
      ))}

      <AlertBanner tone="info" icon="shield-check" message={t('privacy.manualEntryNote')} />

      <Pressable accessibilityRole="button" onPress={onOpenPolicy} hitSlop={8}>
        <Txt
          weight="semibold"
          size="sm"
          color={theme.colors.primary}
          style={{ paddingVertical: theme.spacing.sm }}
        >
          {t('privacy.policyLink')}
        </Txt>
      </Pressable>

      <Button label={t('privacy.acceptButton')} size="lg" onPress={handleAccept} disabled={saving} />
    </AppScreen>
  );
}
