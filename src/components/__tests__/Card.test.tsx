import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '../Card';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { radius, shadowColors } from '../../theme/tokens';

function renderCard(
  element: React.ReactElement,
  { scheme, senior = false }: { scheme?: ColorScheme; senior?: boolean } = {},
) {
  return render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      {element}
    </ThemeProvider>,
  );
}

function cardStyle(testID = 'card') {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
}

describe('Card (US-074a)', () => {
  it('renders its children', async () => {
    await renderCard(
      <Card testID="card">
        <Text>Contenu</Text>
      </Card>,
    );
    expect(screen.getByText('Contenu')).toBeTruthy();
  });

  it('uses the design 14px radius', async () => {
    await renderCard(<Card testID="card" />);
    expect(cardStyle().borderRadius).toBe(14);
    // The literal above is the design spec; this pins the token to it.
    expect(radius.lg).toBe(14);
  });

  it('takes its fill and border from the tokens', async () => {
    await renderCard(<Card testID="card" />);
    const style = cardStyle();
    expect(style.backgroundColor).toBe('#FFFFFF');
    expect(style.borderWidth).toBe(1);
  });

  it('drops the border when borderless', async () => {
    await renderCard(<Card testID="card" borderless />);
    expect(cardStyle().borderWidth).toBe(0);
  });

  it('applies the soft shadow when elevated in light mode', async () => {
    await renderCard(<Card testID="card" elevated />);
    const style = cardStyle();
    expect(style.shadowColor).toBe(shadowColors.neutral);
    expect(style.shadowOpacity).toBe(0.12);
    expect(style.elevation).toBe(3);
  });

  it('carries no shadow when not elevated', async () => {
    await renderCard(<Card testID="card" />);
    expect(cardStyle().shadowColor).toBeUndefined();
  });

  // A dark-mode shadow reads as grime rather than lift; the border does the separating there.
  it('skips the shadow in dark mode even when elevated', async () => {
    await renderCard(<Card testID="card" elevated />, { scheme: 'dark' });
    expect(cardStyle().shadowColor).toBeUndefined();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme, taking its fill from it', async (_name, scheme, senior) => {
    await renderCard(
      <Card testID="card">
        <Text>Contenu</Text>
      </Card>,
      { scheme, senior },
    );
    expect(screen.getByText('Contenu')).toBeTruthy();
    expect(cardStyle().backgroundColor).toBe(scheme === 'dark' ? '#1E293B' : '#FFFFFF');
  });
});
