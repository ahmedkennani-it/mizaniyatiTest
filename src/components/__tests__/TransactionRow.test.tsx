import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TransactionRow } from '../TransactionRow';
import i18n from '../../i18n/i18n';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';

const NOW = new Date(2026, 6, 16, 10, 0);

async function renderRow(
  props: Partial<React.ComponentProps<typeof TransactionRow>> = {},
  { scheme = 'light' as ColorScheme, senior = false } = {},
) {
  await render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      <TransactionRow
        title="Courses"
        occurredAt={new Date(2026, 6, 13, 9, 0).toISOString()}
        memberName="Salma"
        amountMinor={-24000}
        currencyCode="MAD"
        icon="shopping-cart"
        now={NOW}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('TransactionRow (US-074b)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('shows the label', async () => {
    await renderRow();
    expect(screen.getByText('Courses')).toBeTruthy();
  });

  it('shows the date relatively, alongside the member', async () => {
    await renderRow();
    expect(screen.getByText('il y a 3 jours · Salma')).toBeTruthy();
  });

  it('omits the member for a single-member household', async () => {
    await renderRow({ memberName: undefined });
    expect(screen.getByText('il y a 3 jours')).toBeTruthy();
  });

  it('shows the signed amount', async () => {
    await renderRow();
    expect(screen.getByText(/-.*240,00.*MAD/)).toBeTruthy();
  });

  it('shows income without a minus sign', async () => {
    await renderRow({ amountMinor: 500000 });
    expect(screen.queryByText(/-/)).toBeNull();
  });

  it('renders the category glyph', async () => {
    await renderRow();
    expect(screen.getByTestId('icon-shopping-cart', { includeHiddenElements: true })).toBeTruthy();
  });

  it('is not pressable without onPress', async () => {
    await renderRow();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderRow({ onPress });

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the relative date and amount in the active language', async () => {
    await i18n.changeLanguage('ar');
    await renderRow();

    expect(screen.getByText(/قبل ٣ أيام · Salma/)).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderRow({}, { scheme, senior });
    expect(screen.getByText('Courses')).toBeTruthy();
  });
});
