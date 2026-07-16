import React from 'react';
import { I18nManager, StyleSheet, Text, type TextProps } from 'react-native';

import { useLanguage } from './LanguageContext';
import { forceLTR, toLocalizedDigits } from './numberFormat';

export interface AmountTextProps extends Omit<TextProps, 'children'> {
  value: number;
}

/**
 * Displays a numeric amount that always reads left-to-right and uses the active language's
 * digits (Arabic-indic for `ar`), even when rendered inside RTL (Arabic) text.
 */
export function AmountText({ value, style, ...rest }: AmountTextProps) {
  const { language } = useLanguage();
  const formatted = forceLTR(toLocalizedDigits(value, language));

  return (
    <Text
      {...rest}
      style={[styles.ltr, I18nManager.isRTL ? styles.startRTL : styles.startLTR, style]}
    >
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  // `writingDirection` + the LTR marks in `forceLTR` keep the digits and the minus sign in their
  // latin order inside Arabic text. Alignment is a separate concern: hardcoding `left` here would
  // pin the amount to the far edge of an RTL screen, so it follows the reading start instead.
  ltr: {
    writingDirection: 'ltr',
  },
  startLTR: {
    textAlign: 'left',
  },
  startRTL: {
    textAlign: 'right',
  },
});
