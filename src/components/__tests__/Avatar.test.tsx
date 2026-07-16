import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { Avatar } from '../Avatar';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';

async function renderAvatar(element: React.ReactElement, scheme: ColorScheme = 'light', senior = false) {
  await render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      {element}
    </ThemeProvider>,
  );
}

describe('Avatar (US-074b)', () => {
  it('shows the first letter, uppercased', async () => {
    await renderAvatar(<Avatar name="salma" />);
    expect(screen.getByText('S')).toBeTruthy();
  });

  it('ignores leading whitespace when picking the initial', async () => {
    await renderAvatar(<Avatar name="  Youssef" />);
    expect(screen.getByText('Y')).toBeTruthy();
  });

  it('falls back to a placeholder for an empty name rather than rendering blank', async () => {
    await renderAvatar(<Avatar name="   " />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('uses the first letter of an Arabic name', async () => {
    await renderAvatar(<Avatar name="سلمى" />);
    expect(screen.getByText('س')).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderAvatar(<Avatar name="Salma" accent="purple" />, scheme, senior);
    expect(screen.getByText('S')).toBeTruthy();
  });
});
