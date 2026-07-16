import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { Pill } from '../Pill';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

function renderPill(element: React.ReactElement, scheme: ColorScheme = 'light', senior = false) {
  return render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      {element}
    </ThemeProvider>,
  );
}

/** The design system's "Tag": a small status/label pill (US-074a). */
describe('Pill', () => {
  it('renders its label', async () => {
    await renderPill(<Pill label="Payé" />);
    expect(screen.getByText('Payé')).toBeTruthy();
  });

  it('renders an optional leading icon', async () => {
    await renderPill(<Pill label="Payé" icon="check-circle" />);
    expect(screen.getByTestId('icon-check-circle', { includeHiddenElements: true })).toBeTruthy();
  });

  it('omits the icon when none is given', async () => {
    await renderPill(<Pill label="Payé" />);
    expect(screen.queryByTestId('icon-check-circle', { includeHiddenElements: true })).toBeNull();
  });

  it('defaults to the teal ink from the tokens', async () => {
    await renderPill(<Pill label="Payé" />);
    const style = StyleSheet.flatten(screen.getByText('Payé').props.style) as { color?: string };
    expect(style.color).toBe(buildTheme('light', false).accents.teal.ink);
  });

  it('lets the caller pick a semantic color (e.g. danger)', async () => {
    const theme = buildTheme('light', false);
    await renderPill(<Pill label="En retard" color={theme.colors.danger} />);
    const style = StyleSheet.flatten(screen.getByText('En retard').props.style) as { color?: string };
    expect(style.color).toBe(theme.colors.danger);
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderPill(<Pill label="Payé" icon="check-circle" />, scheme, senior);
    expect(screen.getByText('Payé')).toBeTruthy();
  });

  it('takes its default ink from the active scheme, not a fixed value', async () => {
    await renderPill(<Pill label="Payé" />, 'dark');
    const style = StyleSheet.flatten(screen.getByText('Payé').props.style) as { color?: string };
    expect(style.color).toBe(buildTheme('dark', false).accents.teal.ink);
  });
});
