import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { Amount } from '../Amount';
import i18n from '../../i18n/i18n';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

async function renderAmount(
  element: React.ReactElement,
  { language = 'fr', scheme = 'light' as ColorScheme, senior = false } = {},
) {
  await i18n.changeLanguage(language);
  await render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      {element}
    </ThemeProvider>,
  );
}

/** Strips the LTR isolation marks so assertions read normally. */
function text(node: ReturnType<typeof screen.getByTestId>): string {
  return String(node.props.children).replace(/‎/g, '');
}

function colorOf(node: ReturnType<typeof screen.getByTestId>): string | undefined {
  return (StyleSheet.flatten(node.props.style) as { color?: string }).color;
}

describe('Amount (US-074b)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(async () => {
    I18nManager.isRTL = originalIsRTL;
    await i18n.changeLanguage('fr');
  });

  it('renders sign, amount and currency together', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={-123450} currencyCode="MAD" />);
    expect(text(screen.getByTestId('amount'))).toContain('234,50');
    expect(text(screen.getByTestId('amount'))).toContain('MAD');
    expect(text(screen.getByTestId('amount'))).toContain('-');
  });

  it('shows no minus sign on a positive amount', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={123450} currencyCode="MAD" />);
    expect(text(screen.getByTestId('amount'))).not.toContain('-');
  });

  it('adds a leading plus only when asked', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={5000} currencyCode="MAD" showPlusSign />);
    expect(text(screen.getByTestId('amount')).startsWith('+')).toBe(true);
  });

  it('never adds a plus to a negative amount', async () => {
    await renderAmount(
      <Amount testID="amount" amountMinor={-5000} currencyCode="MAD" showPlusSign />,
    );
    expect(text(screen.getByTestId('amount'))).not.toContain('+');
  });

  it('formats per the active locale', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={123450} currencyCode="MAD" />, {
      language: 'en',
    });
    expect(text(screen.getByTestId('amount'))).toContain('1,234.50');
  });

  it('uses Arabic-indic digits and a localized currency in Arabic', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={123450} currencyCode="MAD" />, {
      language: 'ar',
    });
    const rendered = text(screen.getByTestId('amount'));
    expect(rendered).toMatch(/[٠-٩]/);
    expect(rendered).not.toContain('MAD');
  });

  it('never converts between currencies', async () => {
    await renderAmount(<Amount testID="amount" amountMinor={150000} currencyCode="EUR" />);
    expect(text(screen.getByTestId('amount'))).toContain('€');
  });

  describe('tone', () => {
    const theme = buildTheme('light', false);

    it('colors income with the success token', async () => {
      await renderAmount(<Amount testID="amount" amountMinor={5000} currencyCode="MAD" />);
      expect(colorOf(screen.getByTestId('amount'))).toBe(theme.colors.success);
    });

    // A wall of red would read as errors rather than as ordinary spending.
    it('leaves an expense in the default ink rather than red', async () => {
      await renderAmount(<Amount testID="amount" amountMinor={-5000} currencyCode="MAD" />);
      expect(colorOf(screen.getByTestId('amount'))).toBe(theme.colors.textPrimary);
    });

    it('keeps a positive total neutral when asked', async () => {
      await renderAmount(
        <Amount testID="amount" amountMinor={5000} currencyCode="MAD" tone="neutral" />,
      );
      expect(colorOf(screen.getByTestId('amount'))).toBe(theme.colors.textPrimary);
    });

    it('forces the danger token when asked', async () => {
      await renderAmount(
        <Amount testID="amount" amountMinor={5000} currencyCode="MAD" tone="negative" />,
      );
      expect(colorOf(screen.getByTestId('amount'))).toBe(theme.colors.danger);
    });

    it('lets a caller override the color outright (white on a gradient)', async () => {
      await renderAmount(
        <Amount testID="amount" amountMinor={5000} currencyCode="MAD" color={theme.onAccent.text} />,
      );
      expect(colorOf(screen.getByTestId('amount'))).toBe(theme.onAccent.text);
    });

    it('takes its tone from the active scheme, not a fixed value', async () => {
      await renderAmount(<Amount testID="amount" amountMinor={5000} currencyCode="MAD" />, {
        scheme: 'dark',
      });
      expect(colorOf(screen.getByTestId('amount'))).toBe(buildTheme('dark', false).colors.success);
    });
  });

  it('keeps the digits LTR and hugs the reading start in RTL', async () => {
    I18nManager.isRTL = true;
    await renderAmount(<Amount testID="amount" amountMinor={-123450} currencyCode="MAD" />, {
      language: 'ar',
    });

    const style = StyleSheet.flatten(screen.getByTestId('amount').props.style) as Record<
      string,
      unknown
    >;
    expect(style.writingDirection).toBe('ltr');
    expect(style.textAlign).toBe('right');
  });
});
