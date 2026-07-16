import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Txt } from './Txt';
import type { TxtProps } from './Txt';
import type { SupportedLanguage } from '../i18n';
import { formatMoney } from '../money';
import { useTheme } from '../theme';

export type AmountTone = 'auto' | 'neutral' | 'positive' | 'negative';

export interface AmountProps extends Omit<TxtProps, 'children' | 'color'> {
  /** Integer amount in the currency's minor unit — never a float (see `src/money`). */
  amountMinor: number;
  currencyCode: string;
  /**
   * `auto` colors by sign (income green, expense default ink) and is the list default.
   * `neutral` keeps the text color for totals that shouldn't shout, `positive`/`negative` force it.
   */
  tone?: AmountTone;
  /** Forces a leading `+` on positive amounts (transfers in, contributions). */
  showPlusSign?: boolean;
  /** Overrides the color entirely (e.g. white on a gradient hero). */
  color?: string;
  /** Overrides the spoken label — e.g. to add context a bare amount lacks ("reste du mois : …"). */
  accessibilityLabel?: string;
}

/**
 * The one way to render a money value (US-074b): sign, currency and locale formatting all come
 * from `formatMoney`, so no screen interpolates an amount by hand. The digits stay latin-ordered
 * inside Arabic text (`formatMoney` wraps them in LTR marks), and the text hugs the reading start.
 *
 * Callers pass the **signed** minor amount: an expense is negative. Deciding a transaction's sign
 * from its `type` is the caller's job, not this component's.
 */
export function Amount({
  amountMinor,
  currencyCode,
  tone = 'auto',
  showPlusSign = false,
  color,
  style,
  accessibilityLabel,
  ...rest
}: AmountProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  const formatted = formatMoney(amountMinor, currencyCode, language);
  const withSign = showPlusSign && amountMinor > 0 ? `+${formatted}` : formatted;

  return (
    <Txt
      {...rest}
      // The visible string is padded with invisible LTR marks so the digits keep their order inside
      // Arabic text (see `forceLTR`). Those marks are for the *bidi algorithm*, not for a screen
      // reader, so the spoken label is the same amount with them stripped (US-075b).
      accessibilityLabel={accessibilityLabel ?? stripBidiMarks(withSign)}
      color={color ?? toneColor(theme, tone, amountMinor)}
      style={[styles.start, I18nManager.isRTL ? styles.startRTL : styles.startLTR, style]}
    >
      {withSign}
    </Txt>
  );
}

const LEFT_TO_RIGHT_MARK = /\u200E/g;

function stripBidiMarks(text: string): string {
  return text.replace(LEFT_TO_RIGHT_MARK, '');
}

function toneColor(
  theme: ReturnType<typeof useTheme>['theme'],
  tone: AmountTone,
  amountMinor: number,
): string {
  switch (tone) {
    case 'positive':
      return theme.colors.success;
    case 'negative':
      return theme.colors.danger;
    case 'neutral':
      return theme.colors.textPrimary;
    case 'auto':
    default:
      // Only income is colored. Expenses are the common case, and a wall of red reads as errors
      // rather than as normal spending.
      return amountMinor > 0 ? theme.colors.success : theme.colors.textPrimary;
  }
}

const styles = StyleSheet.create({
  start: {
    writingDirection: 'ltr',
  },
  startLTR: {
    textAlign: 'left',
  },
  startRTL: {
    textAlign: 'right',
  },
});
