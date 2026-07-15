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
  amountMinor: number;
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

const ON_GRADIENT = '#FFFFFF';

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
  barColor = ON_GRADIENT,
  cornerIcon,
  cornerColor,
}: BalanceHeroCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const font = useAppFont();
  const language = (i18n.language === 'ar' ? 'ar' : 'fr') as SupportedLanguage;

  const major = toMajorUnits(Math.abs(amountMinor), currencyCode);
  const sign = amountMinor < 0 ? '-' : '';
  const amountText = forceLTR(`${sign}${toLocalizedDigits(major, language)}`);
  const colors = theme.gradients[gradient] as [string, string, ...string[]];
  const rtl = I18nManager.isRTL;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: rtl ? 1 : 0, y: 0 }}
      end={{ x: rtl ? 0 : 1, y: 1 }}
      style={{ borderRadius: theme.radius.lg + 10, padding: theme.spacing.lg, overflow: 'hidden' }}
    >
      <View
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
      {cornerIcon ? (
        <View style={{ position: 'absolute', top: 16, right: 18 }}>
          <Icon name={cornerIcon} size={30} color={cornerColor ?? '#FCD34D'} />
        </View>
      ) : null}

      <Txt size="sm" color="rgba(255,255,255,0.85)">
        {label}
      </Txt>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm, marginTop: 6 }}>
        <Txt color={ON_GRADIENT} size={42} style={{ fontFamily: font.extrabold, letterSpacing: -0.5 }}>
          {amountText}
        </Txt>
        <Txt color="rgba(255,255,255,0.9)" weight="semibold" size="md">
          {currencyCode}
        </Txt>
      </View>

      {progress !== undefined ? (
        <View
          style={{
            height: 7,
            borderRadius: theme.radius.full,
            backgroundColor: 'rgba(255,255,255,0.22)',
            marginTop: theme.spacing.md,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: '100%',
              borderRadius: theme.radius.full,
              backgroundColor: barColor,
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
              <Txt size="xs" color="rgba(255,255,255,0.8)">
                {footerStart.label}
              </Txt>
              <Txt weight="semibold" size="sm" color={ON_GRADIENT}>
                {footerStart.value}
              </Txt>
            </View>
          ) : (
            <View />
          )}
          {footerEnd ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt size="xs" color="rgba(255,255,255,0.8)">
                {footerEnd.label}
              </Txt>
              <Txt weight="semibold" size="sm" color={ON_GRADIENT}>
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
