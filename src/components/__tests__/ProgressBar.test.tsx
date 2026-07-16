import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { ProgressBar } from '../ProgressBar';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

async function renderBar(element: React.ReactElement, scheme: ColorScheme = 'light') {
  await render(<ThemeProvider initialColorScheme={scheme}>{element}</ThemeProvider>);
}

/** The fill is the track's only child. */
function fillStyle() {
  const track = screen.getByTestId('bar');
  return StyleSheet.flatten(track.props.children.props.style) as Record<string, unknown>;
}

const theme = buildTheme('light', false);

describe('ProgressBar (US-074b)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('sizes the fill to the value', async () => {
    await renderBar(<ProgressBar testID="bar" progress={0.4} />);
    expect(fillStyle().width).toBe('40%');
  });

  it.each([
    [-1, '0%'],
    [0, '0%'],
    [1, '100%'],
    [2.5, '100%'],
  ])('clamps a value of %s to %s', async (progress, expected) => {
    await renderBar(<ProgressBar testID="bar" progress={progress} />);
    expect(fillStyle().width).toBe(expected);
  });

  it('takes its fill from the accent tokens', async () => {
    await renderBar(<ProgressBar testID="bar" progress={0.4} accent="purple" />);
    expect(fillStyle().backgroundColor).toBe(theme.accents.purple.solid);
  });

  describe('alert threshold', () => {
    it('stays on the accent color below the threshold', async () => {
      await renderBar(<ProgressBar testID="bar" progress={0.8} alertThreshold={0.9} />);
      expect(fillStyle().backgroundColor).toBe(theme.accents.teal.solid);
    });

    it('switches to the alert color at the threshold', async () => {
      await renderBar(<ProgressBar testID="bar" progress={0.9} alertThreshold={0.9} />);
      expect(fillStyle().backgroundColor).toBe(theme.accents.coral.solid);
    });

    it('stays alerting past the threshold', async () => {
      await renderBar(<ProgressBar testID="bar" progress={1.4} alertThreshold={0.9} />);
      expect(fillStyle().backgroundColor).toBe(theme.accents.coral.solid);
    });

    it('lets the caller pick the alert color', async () => {
      await renderBar(
        <ProgressBar
          testID="bar"
          progress={1}
          alertThreshold={0.9}
          alertColor={theme.colors.danger}
        />,
      );
      expect(fillStyle().backgroundColor).toBe(theme.colors.danger);
    });

    it('never alerts when no threshold is given', async () => {
      await renderBar(<ProgressBar testID="bar" progress={1} />);
      expect(fillStyle().backgroundColor).toBe(theme.accents.teal.solid);
    });

    it('lets an explicit color win over the threshold', async () => {
      await renderBar(
        <ProgressBar
          testID="bar"
          progress={1}
          alertThreshold={0.9}
          color={theme.colors.success}
        />,
      );
      expect(fillStyle().backgroundColor).toBe(theme.colors.success);
    });
  });

  // `alignSelf: flex-start` follows the layout direction, so the fill grows from the reading side.
  it.each([
    ['LTR', false],
    ['RTL', true],
  ])('grows from the reading start in %s', async (_name, isRTL) => {
    I18nManager.isRTL = isRTL;
    await renderBar(<ProgressBar testID="bar" progress={0.4} />);
    expect(fillStyle().alignSelf).toBe('flex-start');
  });

  it('takes its track from the active scheme', async () => {
    await renderBar(<ProgressBar testID="bar" progress={0.4} />, 'dark');
    const track = StyleSheet.flatten(screen.getByTestId('bar').props.style) as Record<
      string,
      unknown
    >;
    expect(track.backgroundColor).toBe(buildTheme('dark', false).colors.surfaceAlt);
  });
});
