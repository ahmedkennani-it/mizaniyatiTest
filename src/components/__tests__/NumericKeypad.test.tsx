import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { NumericKeypad } from '../NumericKeypad';
import i18n from '../../i18n/i18n';
import { ar } from '../../i18n/locales/ar';
import { fr } from '../../i18n/locales/fr';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

async function renderKeypad(
  value: string,
  { currencyCode = 'MAD', scheme = 'light' as ColorScheme, senior = false } = {},
) {
  const onChange = jest.fn();
  await render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      <NumericKeypad value={value} onChange={onChange} currencyCode={currencyCode} />
    </ThemeProvider>,
  );
  return { onChange };
}

const key = (label: string) => screen.getByRole('button', { name: label });

describe('NumericKeypad (US-016)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('offers every digit', async () => {
    await renderKeypad('');
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(key(digit)).toBeTruthy();
    }
  });

  it('appends a pressed digit', async () => {
    const { onChange } = await renderKeypad('4');

    await fireEvent.press(key('2'));

    expect(onChange).toHaveBeenCalledWith('42');
  });

  describe('decimals', () => {
    it('appends a decimal point', async () => {
      const { onChange } = await renderKeypad('42');

      await fireEvent.press(key(fr.expenseForm.decimalKey));

      expect(onChange).toHaveBeenCalledWith('42.');
    });

    /** ".5" is not a number a parser should have to guess at. */
    it('starts a bare decimal at zero', async () => {
      const { onChange } = await renderKeypad('');

      await fireEvent.press(key(fr.expenseForm.decimalKey));

      expect(onChange).toHaveBeenCalledWith('0.');
    });

    it('refuses a third decimal on a 2-decimal currency', async () => {
      const { onChange } = await renderKeypad('42.50');

      await fireEvent.press(key('5'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('refuses a second decimal point', async () => {
      const { onChange } = await renderKeypad('42.5');

      await fireEvent.press(key(fr.expenseForm.decimalKey));

      expect(onChange).not.toHaveBeenCalled();
    });

    /** A key that does nothing is worse than no key: it invites a press that is ignored. */
    it('offers no decimal key at all for a currency without decimals', async () => {
      await renderKeypad('', { currencyCode: 'JPY' });

      expect(screen.queryByRole('button', { name: fr.expenseForm.decimalKey })).toBeNull();
    });

    it('accepts three decimals for a 3-decimal currency', async () => {
      const { onChange } = await renderKeypad('42.50', { currencyCode: 'BHD' });

      await fireEvent.press(key('5'));

      expect(onChange).toHaveBeenCalledWith('42.505');
    });

    it('shows the locale separator on the key, whatever the value uses', async () => {
      await renderKeypad('');
      expect(screen.getByText(fr.expenseForm.decimalSeparator)).toBeTruthy();

      screen.unmount();
      await i18n.changeLanguage('ar');
      await renderKeypad('');
      expect(screen.getByText(ar.expenseForm.decimalSeparator)).toBeTruthy();
    });
  });

  describe('backspace', () => {
    it('drops the last character', async () => {
      const { onChange } = await renderKeypad('42.5');

      await fireEvent.press(key(fr.expenseForm.backspaceKey));

      expect(onChange).toHaveBeenCalledWith('42.');
    });

    it('does nothing harmful on an empty value', async () => {
      const { onChange } = await renderKeypad('');

      await fireEvent.press(key(fr.expenseForm.backspaceKey));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  it('gives every key a full touch target', async () => {
    await renderKeypad('');
    expect(key('7').props.style.minHeight).toBe(buildTheme('light', false).minTouchTarget);
  });

  it('grows the keys in senior mode', async () => {
    await renderKeypad('', { senior: true });
    expect(key('7').props.style.minHeight).toBe(buildTheme('light', true).minTouchTarget);
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderKeypad('42', { scheme, senior });
    expect(key('7')).toBeTruthy();
  });
});
