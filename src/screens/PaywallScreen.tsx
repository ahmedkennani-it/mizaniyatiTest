import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Pill, ScreenHeader, TrustChip, Txt } from '../components';
import { FREE_PLAN, PRO_PLAN } from '../entitlements';
import { useSubscription } from '../subscriptions';
import { useTheme } from '../theme';

/**
 * A trigger that sent the household here (a limit hit, a locked feature tapped) — the matching
 * comparison row is highlighted (US-065's "la ligne correspondante est mise en évidence"). `null`
 * covers every row key that combines several entitlements (`tontine`+`debts`, `zakat`+`ramadan`).
 */
export type PaywallHighlightKey =
  | 'categories.max'
  | 'members.max'
  | 'voice'
  | 'tontine'
  | 'debts'
  | 'zakat'
  | 'ramadan';

export interface PaywallScreenProps {
  onBack: () => void;
  highlightKey?: PaywallHighlightKey;
}

function planLimit(planId: 'free' | 'pro', key: string): number {
  const plan = planId === 'free' ? FREE_PLAN : PRO_PLAN;
  return plan.entitlements.find((entitlement) => entitlement.key === key)?.numericValue ?? 0;
}

function planFeature(planId: 'free' | 'pro', key: string): boolean {
  const plan = planId === 'free' ? FREE_PLAN : PRO_PLAN;
  return plan.entitlements.find((entitlement) => entitlement.key === key)?.booleanValue ?? false;
}

interface ComparisonRow {
  /** One or more `PaywallHighlightKey`s this row represents — `highlightKey` matches any of them. */
  matchKeys: PaywallHighlightKey[];
  label: string;
  free: string;
  pro: string;
  proIsBetter: boolean;
}

export function PaywallScreen({ onBack, highlightKey }: PaywallScreenProps) {
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

  const check = t('paywallScreen.checkMark');
  const dash = t('paywallScreen.dashMark');
  const unlimited = t('paywallScreen.unlimitedLabel');

  const rows: ComparisonRow[] = [
    {
      matchKeys: [],
      label: t('paywallScreen.trackingRowLabel'),
      free: check,
      pro: check,
      proIsBetter: false,
    },
    {
      matchKeys: ['categories.max'],
      label: t('paywallScreen.categoriesRowLabel'),
      free: String(planLimit('free', 'categories.max')),
      pro: unlimited,
      proIsBetter: true,
    },
    {
      matchKeys: ['members.max'],
      label: t('paywallScreen.membersRowLabel'),
      free: String(planLimit('free', 'members.max')),
      pro: unlimited,
      proIsBetter: true,
    },
    {
      matchKeys: ['voice'],
      label: t('paywallScreen.voiceRowLabel'),
      free: planFeature('free', 'voice') ? check : dash,
      pro: planFeature('pro', 'voice') ? check : dash,
      proIsBetter: true,
    },
    {
      matchKeys: ['tontine', 'debts'],
      label: t('paywallScreen.tontineDebtsRowLabel'),
      free: planFeature('free', 'tontine') && planFeature('free', 'debts') ? check : dash,
      pro: planFeature('pro', 'tontine') && planFeature('pro', 'debts') ? check : dash,
      proIsBetter: true,
    },
    {
      matchKeys: ['zakat', 'ramadan'],
      label: t('paywallScreen.zakatRamadanRowLabel'),
      free: planFeature('free', 'zakat') && planFeature('free', 'ramadan') ? check : dash,
      pro: planFeature('pro', 'zakat') && planFeature('pro', 'ramadan') ? check : dash,
      proIsBetter: true,
    },
  ];

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('paywallScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('paywallScreen.subtitle')}
      </Txt>
      <TrustChip label={t('paywallScreen.noBankBadge')} />

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

        {rows.map((row) => {
          const isHighlighted = highlightKey !== undefined && row.matchKeys.includes(highlightKey);
          return (
            <View
              key={row.label}
              testID={`paywall-row-${row.matchKeys[0] ?? 'tracking'}`}
              style={{
                flexDirection: 'row',
                borderRadius: theme.radius.sm,
                padding: theme.spacing.xs,
                borderWidth: isHighlighted ? 2 : 0,
                borderColor: isHighlighted ? theme.colors.primary : 'transparent',
                backgroundColor: isHighlighted ? theme.accents.teal.wash : 'transparent',
              }}
            >
              <Txt size="sm" weight={isHighlighted ? 'semibold' : 'regular'} style={{ flex: 2 }}>
                {row.label}
              </Txt>
              <Txt size="sm" style={{ flex: 1, textAlign: 'center' }} color={theme.colors.textSecondary}>
                {row.free}
              </Txt>
              <Txt
                size="sm"
                weight="semibold"
                style={{ flex: 1, textAlign: 'center' }}
                color={row.proIsBetter ? theme.colors.primary : theme.colors.textSecondary}
              >
                {row.pro}
              </Txt>
            </View>
          );
        })}
      </Card>
    </AppScreen>
  );
}
