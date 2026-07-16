import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { AmountText } from '../AmountText';
import { LanguageProvider } from '../LanguageContext';
import i18n from '../i18n';

async function renderAmountIn(language: 'fr' | 'ar', value: number) {
  await i18n.changeLanguage(language);
  await render(
    <LanguageProvider>
      <AmountText testID="amount" value={value} />
    </LanguageProvider>,
  );
  return screen.getByTestId('amount');
}

/**
 * US-061b, mixed-script screens: an amount is a run of latin-ordered digits sitting inside Arabic
 * prose. Without the LTR marks the bidi algorithm reorders a leading minus sign to the far side of
 * the number ("1234-"), which silently turns an expense into something else.
 */
describe('AmountText bidi handling', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(async () => {
    I18nManager.isRTL = originalIsRTL;
    await i18n.changeLanguage('fr');
  });

  it('isolates the amount with LTR marks so it keeps its order inside Arabic text', async () => {
    I18nManager.isRTL = true;
    const amount = await renderAmountIn('ar', -1234.5);

    const rendered = amount.props.children as string;
    expect(rendered.startsWith('‎')).toBe(true);
    expect(rendered.endsWith('‎')).toBe(true);
    expect(StyleSheet.flatten(amount.props.style)).toMatchObject({ writingDirection: 'ltr' });
  });

  it('uses Arabic-indic digits in Arabic and western digits in French', async () => {
    expect((await renderAmountIn('ar', 1234)).props.children).toContain('١');
    screen.unmount();
    expect((await renderAmountIn('fr', 1234)).props.children).toContain('1');
  });

  it('aligns to the reading start rather than always to the left', async () => {
    I18nManager.isRTL = true;
    const inArabic = await renderAmountIn('ar', 1234);
    expect(StyleSheet.flatten(inArabic.props.style)).toMatchObject({ textAlign: 'right' });

    screen.unmount();

    I18nManager.isRTL = false;
    const inFrench = await renderAmountIn('fr', 1234);
    expect(StyleSheet.flatten(inFrench.props.style)).toMatchObject({ textAlign: 'left' });
  });

  it('renders latin digits inside an Arabic sentence without reordering the sentence', async () => {
    I18nManager.isRTL = true;
    await i18n.changeLanguage('ar');
    await render(
      <LanguageProvider>
        <View>
          <Text>رصيد الشهر</Text>
          <AmountText testID="amount" value={1234} />
        </View>
      </LanguageProvider>,
    );

    expect(screen.getByText('رصيد الشهر')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('amount').props.style)).toMatchObject({
      writingDirection: 'ltr',
    });
  });
});
