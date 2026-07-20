import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AlertBanner, AppScreen, Button, Card, Pill, ScreenHeader, TrustChip, Txt } from '../components';
import { getDatabase } from '../db/client';
import { listHouseholds } from '../db/repositories';
import type { Household } from '../db/repositories';
import { useLanguage } from '../i18n';
import { formatMoney, DEFAULT_CURRENCY_CODE } from '../money';
import { FREE_PLAN, PRO_PLAN } from '../entitlements';
import {
  PurchaseCancelledError,
  annualDiscountPercent,
  cancelSubscription,
  priceFor,
  purchasePro,
  restorePurchases,
} from '../purchases';
import type { PurchaseProductId } from '../purchases';
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
  const { language } = useLanguage();
  const { plan, subscription, trialAlreadyUsed, startTrial, refresh } = useSubscription();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PurchaseProductId>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    listHouseholds(getDatabase()).then(setHouseholds);
  }, []);

  const isPro = plan.id === PRO_PLAN.id;
  const isTrialing = isPro && subscription?.status === 'trial';
  // US-069: a real (paid) purchase, active or cancelled-but-still-paid-for — not a trial, and not
  // the transient moment before any row exists.
  const isManagedSubscription =
    isPro && (subscription?.status === 'active' || subscription?.status === 'cancelled');
  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;
  const discountPercent = annualDiscountPercent();

  async function handlePurchase() {
    setPurchaseError(null);
    setPurchasing(true);
    try {
      await purchasePro(getDatabase(), selectedProduct);
      await refresh();
    } catch (error) {
      setPurchaseError(
        error instanceof PurchaseCancelledError
          ? t('paywallScreen.purchaseCancelledError')
          : t('paywallScreen.purchaseNetworkError'),
      );
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setRestoreMessage(null);
    try {
      const result = await restorePurchases(getDatabase());
      setRestoreMessage(
        result.restored ? t('paywallScreen.restoreFoundMessage') : t('paywallScreen.restoreNoneMessage'),
      );
      if (result.restored) {
        await refresh();
      }
    } finally {
      setRestoring(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelSubscription(getDatabase());
      await refresh();
    } finally {
      setCancelling(false);
    }
  }

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
          <>
            <Button label={t('paywallScreen.startTrialButton')} onPress={startTrial} />
            <Txt size="xs" color={theme.colors.textSecondary}>
              {t('paywallScreen.trialCommitmentNote')}
            </Txt>
          </>
        ) : null}
        {/* US-069's 3rd criterion — a new device starts on the free plan with no way to know
            whether it already owns Pro; always offered, not just once a purchase is missing. */}
        <Button
          label={t('paywallScreen.restoreButton')}
          variant="secondary"
          onPress={handleRestore}
          disabled={restoring}
        />
        {restoreMessage ? (
          <Txt size="xs" color={theme.colors.textSecondary}>
            {restoreMessage}
          </Txt>
        ) : null}
      </Card>

      {isManagedSubscription ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('paywallScreen.manageTitle')}
          </Txt>
          <Txt size="sm">
            {subscription?.productId === 'annual'
              ? t('paywallScreen.annualProductLabel')
              : t('paywallScreen.monthlyProductLabel')}
          </Txt>
          {subscription?.status === 'cancelled' && subscription.renewsAt ? (
            <AlertBanner
              tone="info"
              icon="alert-circle"
              message={t('paywallScreen.cancelledUntilLabel', {
                date: subscription.renewsAt.slice(0, 10),
              })}
            />
          ) : (
            <>
              {subscription?.renewsAt ? (
                <Txt size="sm" color={theme.colors.textSecondary}>
                  {t('paywallScreen.renewsOnLabel', { date: subscription.renewsAt.slice(0, 10) })}
                </Txt>
              ) : null}
              <Button
                label={t('paywallScreen.cancelButton')}
                variant="secondary"
                onPress={handleCancel}
                disabled={cancelling}
              />
            </>
          )}
        </Card>
      ) : null}

      {!isPro ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('paywallScreen.pricingTitle')}
          </Txt>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['monthly', 'annual'] as PurchaseProductId[]).map((productId) => {
              const price = priceFor(productId, currencyCode);
              const isSelected = selectedProduct === productId;
              return (
                <Pressable
                  key={productId}
                  testID={`paywall-product-${productId}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedProduct(productId)}
                  style={{
                    flex: 1,
                    gap: 2,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSelected ? theme.accents.teal.wash : theme.colors.surface,
                  }}
                >
                  {productId === 'annual' ? (
                    <Pill
                      label={t('paywallScreen.annualDiscountBadge', { percent: discountPercent })}
                      background={theme.accents.gold.wash}
                      color={theme.accents.gold.ink}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  ) : null}
                  <Txt weight="semibold" size="sm">
                    {productId === 'annual'
                      ? t('paywallScreen.annualProductLabel')
                      : t('paywallScreen.monthlyProductLabel')}
                  </Txt>
                  <Txt size="sm" color={theme.colors.textSecondary}>
                    {productId === 'annual'
                      ? t('paywallScreen.annualPriceLabel', {
                          amount: formatMoney(price.amountMinor, price.currencyCode, language),
                        })
                      : t('paywallScreen.monthlyPriceLabel', {
                          amount: formatMoney(price.amountMinor, price.currencyCode, language),
                        })}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          {purchaseError ? <AlertBanner tone="warning" icon="alert-triangle" message={purchaseError} /> : null}

          <Button
            label={t('paywallScreen.purchaseButton')}
            onPress={handlePurchase}
            disabled={purchasing}
          />
        </Card>
      ) : null}

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
