import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Pill, ScreenHeader, Txt } from '../components';
import { FREE_PLAN, PRO_PLAN } from '../entitlements';
import { useSubscription } from '../subscriptions';
import { useTheme } from '../theme';

export interface PaywallScreenProps {
  onBack: () => void;
}

function planLimit(planId: 'free' | 'pro', key: string): number {
  const plan = planId === 'free' ? FREE_PLAN : PRO_PLAN;
  return plan.entitlements.find((entitlement) => entitlement.key === key)?.numericValue ?? 0;
}

function planFeature(planId: 'free' | 'pro', key: string): boolean {
  const plan = planId === 'free' ? FREE_PLAN : PRO_PLAN;
  return plan.entitlements.find((entitlement) => entitlement.key === key)?.booleanValue ?? false;
}

export function PaywallScreen({ onBack }: PaywallScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { plan, subscription, trialAlreadyUsed, startTrial } = useSubscription();

  const isPro = plan.id === PRO_PLAN.id;
  const isTrialing = isPro && subscription?.status === 'trial';

  function statusLabel(): string {
    if (isTrialing && subscription?.trialEndsAt) {
      return t('paywallScreen.statusTrialLabel', { date: subscription.trialEndsAt.slice(0, 10) });
    }
    if (isPro) {
      return t('paywallScreen.statusActiveLabel');
    }
    if (trialAlreadyUsed) {
      return t('paywallScreen.statusTrialEndedLabel');
    }
    return t('paywallScreen.statusFreeLabel');
  }

  const featureRows: { label: string; key: string }[] = [
    { label: t('paywallScreen.voiceRowLabel'), key: 'voice' },
    { label: t('paywallScreen.tontineRowLabel'), key: 'tontine' },
    { label: t('paywallScreen.zakatRowLabel'), key: 'zakat' },
    { label: t('paywallScreen.ramadanRowLabel'), key: 'ramadan' },
  ];

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('paywallScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('paywallScreen.subtitle')}
      </Txt>

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Pill
          icon="shield-check"
          label={statusLabel()}
          background={theme.accents.teal.wash}
          color={theme.accents.teal.ink}
          style={{ alignSelf: 'flex-start' }}
        />
        {!isPro && !trialAlreadyUsed ? (
          <Button label={t('paywallScreen.startTrialButton')} onPress={startTrial} />
        ) : null}
        {!isPro ? (
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t('paywallScreen.noCardRequiredNote')}
          </Txt>
        ) : null}
      </Card>

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('paywallScreen.comparisonTitle')}
        </Txt>

        <View style={{ flexDirection: 'row' }}>
          <Txt size="xs" color={theme.colors.textSecondary} style={{ flex: 2 }}>
            {t('paywallScreen.featureColumnLabel')}
          </Txt>
          <Txt
            size="xs"
            color={theme.colors.textSecondary}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {t('paywallScreen.freeColumnLabel')}
          </Txt>
          <Txt
            size="xs"
            color={theme.colors.textSecondary}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {t('paywallScreen.proColumnLabel')}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Txt size="sm" style={{ flex: 2 }}>
            {t('paywallScreen.categoriesRowLabel')}
          </Txt>
          <Txt size="sm" style={{ flex: 1, textAlign: 'center' }}>
            {planLimit('free', 'categories.max')}
          </Txt>
          <Txt
            size="sm"
            weight="semibold"
            color={theme.colors.primary}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {t('paywallScreen.unlimitedLabel')}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Txt size="sm" style={{ flex: 2 }}>
            {t('paywallScreen.membersRowLabel')}
          </Txt>
          <Txt size="sm" style={{ flex: 1, textAlign: 'center' }}>
            {planLimit('free', 'members.max')}
          </Txt>
          <Txt
            size="sm"
            weight="semibold"
            color={theme.colors.primary}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {t('paywallScreen.unlimitedLabel')}
          </Txt>
        </View>

        {featureRows.map((row) => (
          <View key={row.key} style={{ flexDirection: 'row' }}>
            <Txt size="sm" style={{ flex: 2 }}>
              {row.label}
            </Txt>
            <Txt
              size="sm"
              style={{ flex: 1, textAlign: 'center' }}
              color={theme.colors.textSecondary}
            >
              {planFeature('free', row.key) ? '✓' : '—'}
            </Txt>
            <Txt
              size="sm"
              weight="semibold"
              style={{ flex: 1, textAlign: 'center' }}
              color={
                planFeature('pro', row.key) ? theme.colors.primary : theme.colors.textSecondary
              }
            >
              {planFeature('pro', row.key) ? '✓' : '—'}
            </Txt>
          </View>
        ))}
      </Card>
    </AppScreen>
  );
}
