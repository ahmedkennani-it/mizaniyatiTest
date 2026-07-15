import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

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
    <Text {...rest} style={[styles.ltr, style]}>
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  ltr: {
    writingDirection: 'ltr',
    textAlign: 'left',
  },
});
