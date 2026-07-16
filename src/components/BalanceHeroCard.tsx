import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { I18nManager, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import type { SupportedLanguage } from '../i18n';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { toMajorUnits } from '../money';
import { useAppFont, useTheme } from '../theme';
import type { GradientName } from '../theme';

export interface HeroStat {
  label: string;
  value: string;
}

export interface BalanceHeroCardProps {
  label: string;
  /**
   * `null` renders an em dash instead of a figure — for a month with **no transactions at all**,
   * which is not the same thing as a month whose income and expenses cancel out to zero (US-015).
   */
  amountMinor: number | null;
  currencyCode: string;
  /** 0–1 progress bar over the gradient (e.g. remaining vs. income). */
  progress?: number;
  /** Left + right footer stats (revenus / dépenses). */
  footerStart?: HeroStat;
  footerEnd?: HeroStat;
  gradient?: GradientName;
  /** Progress-fill color over the gradient (default white; Ramadan uses gold). */
  barColor?: string;
  /** Decorative icon in the top corner (e.g. moon-star for Ramadan). */
  cornerIcon?: IconName;
  cornerColor?: string;
}

/**
 * The gradient balance hero: label, a large LTR amount (localized digits) + currency code, an
 * optional progress bar, and two footer stats. The amount is formatted from integer minor units via
 * `toMajorUnits` + `toLocalizedDigits` + `forceLTR` (never a float; reads LTR even in Arabic).
 * Language comes from the global i18n instance so the card works without a `LanguageProvider`.
 * The gradient direction and footer row mirror under RTL.
 */
export function BalanceHeroCard({
  label,
  amountMinor,
  currencyCode,
  progress,
  footerStart,
  footerEnd,
  gradient = 'balance',
  barColor,
  cornerIcon,
  cornerColor,
}: BalanceHeroCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const onAccent = theme.onAccent;
  const barFill = barColor ?? onAccent.text;
  const font = useAppFont();
  const language = (i18n.language === 'ar' ? 'ar' : 'fr') as SupportedLanguage;

  const amountText =
    amountMinor === null
      ? EM_DASH
      : forceLTR(
          `${amountMinor < 0 ? '-' : ''}${toLocalizedDigits(toMajorUnits(Math.abs(amountMinor), currencyCode), language)}`,
        );
  const colors = theme.gradients[gradient] as [string, string, ...string[]];
  const rtl = I18nManager.isRTL;

  return (
    <LinearGradient
      testID="balance-hero"
      colors={colors}
      start={{ x: rtl ? 1 : 0, y: 0 }}
      end={{ x: rtl ? 0 : 1, y: 1 }}
      style={{ borderRadius: theme.radius.lg + 10, padding: theme.spacing.lg, overflow: 'hidden' }}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          top: -40,
          end: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: onAccent.veil,
        }}
      />
      {cornerIcon ? (
        <View style={{ position: 'absolute', top: 16, end: 18 }}>
          <Icon name={cornerIcon} size={30} color={cornerColor ?? onAccent.accentGold} />
        </View>
      ) : null}

      <Txt size="sm" color={onAccent.text}>
        {label}
      </Txt>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: theme.spacing.sm,
          marginTop: 6,
        }}
      >
        <Txt
          testID="balance-hero-amount"
          color={onAccent.text}
          size={42}
          style={{ fontFamily: font.extrabold, letterSpacing: -0.5 }}
        >
          {amountText}
        </Txt>
        <Txt color={onAccent.text} weight="semibold" size="md">
          {currencyCode}
        </Txt>
      </View>

      {progress !== undefined ? (
        <View
          style={{
            height: 7,
            borderRadius: theme.radius.full,
            backgroundColor: onAccent.fill,
            marginTop: theme.spacing.md,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: '100%',
              borderRadius: theme.radius.full,
              backgroundColor: barFill,
              alignSelf: 'flex-start',
            }}
          />
        </View>
      ) : null}

      {footerStart || footerEnd ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.md,
          }}
        >
          {footerStart ? (
            <View>
              <Txt size="xs" color={onAccent.text}>
                {footerStart.label}
              </Txt>
              <Txt weight="semibold" size="sm" color={onAccent.text}>
                {footerStart.value}
              </Txt>
            </View>
          ) : (
            <View />
          )}
          {footerEnd ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt size="xs" color={onAccent.text}>
                {footerEnd.label}
              </Txt>
              <Txt weight="semibold" size="sm" color={onAccent.text}>
                {footerEnd.value}
              </Txt>
            </View>
          ) : (
            <View />
          )}
        </View>
      ) : null}
    </LinearGradient>
  );
}

/** Reads as "nothing here yet" rather than as the number zero. */
const EM_DASH = '—';
