import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { Button } from '../Button';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

/** Resolves the style RN would apply, including the `pressed`-state style function. */
function buttonStyle() {
  const style = screen.getByRole('button').props.style;
  const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
  return StyleSheet.flatten(resolved) as Record<string, unknown>;
}

describe('Button', () => {
  it('fires onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={onPress} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={onPress} disabled />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled state to assistive technology', async () => {
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={() => {}} disabled />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button variants (US-074a)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  async function renderButton(element: React.ReactElement, scheme: ColorScheme = 'light', senior = false) {
    await render(
      <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
        {element}
      </ThemeProvider>,
    );
  }

  it('fills the primary variant with the primary token', async () => {
    await renderButton(<Button label="Valider" onPress={() => {}} />);
    expect(buttonStyle().backgroundColor).toBe(buildTheme('light', false).colors.primary);
  });

  it('gives the secondary variant the muted surface and a border', async () => {
    const theme = buildTheme('light', false);
    await renderButton(<Button label="Annuler" variant="secondary" onPress={() => {}} />);

    const style = buttonStyle();
    expect(style.backgroundColor).toBe(theme.colors.surfaceAlt);
    expect(style.borderColor).toBe(theme.colors.border);
  });

  it('fills the danger variant with the danger token', async () => {
    await renderButton(<Button label="Supprimer" variant="danger" onPress={() => {}} />);
    expect(buttonStyle().backgroundColor).toBe(buildTheme('light', false).colors.danger);
  });

  it('takes its fill from the active scheme rather than a fixed value', async () => {
    await renderButton(<Button label="Valider" onPress={() => {}} />, 'dark');
    expect(buttonStyle().backgroundColor).toBe(buildTheme('dark', false).colors.primary);
  });

  it('grows its touch target in senior mode', async () => {
    await renderButton(<Button label="Valider" onPress={() => {}} />, 'light', true);
    expect(buttonStyle().minHeight).toBe(buildTheme('light', true).minTouchTarget);
  });

  it('renders an optional leading icon', async () => {
    await renderButton(<Button label="Ajouter" icon="plus" onPress={() => {}} />);
    expect(screen.getByTestId('icon-plus', { includeHiddenElements: true })).toBeTruthy();
  });

  it.each([
    ['LTR', false],
    ['RTL', true],
  ])('renders the gradient variant in %s', async (_name, isRTL) => {
    I18nManager.isRTL = isRTL;
    await renderButton(<Button label="Continuer" variant="gradient" onPress={() => {}} />);
    expect(screen.getByText('Continuer')).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders every variant under the %s theme', async (_name, scheme, senior) => {
    await renderButton(
      <>
        <Button label="Primaire" onPress={() => {}} />
        <Button label="Secondaire" variant="secondary" onPress={() => {}} />
        <Button label="Danger" variant="danger" onPress={() => {}} />
        <Button label="Dégradé" variant="gradient" onPress={() => {}} />
      </>,
      scheme,
      senior,
    );

    expect(screen.getAllByRole('button')).toHaveLength(4);
  });
});
