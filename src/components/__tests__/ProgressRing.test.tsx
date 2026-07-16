import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';

import { ProgressRing } from '../ProgressRing';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';

async function renderRing(element: React.ReactElement, scheme: ColorScheme = 'light') {
  await render(<ThemeProvider initialColorScheme={scheme}>{element}</ThemeProvider>);
}

/**
 * Reads the arc's **JSX** props off the element tree rather than the rendered host node:
 * `react-native-svg` normalizes `stroke` into an internal color object once rendered, so the
 * rendered node can't be compared against a token hex.
 */
function circles(): { props: { stroke: string; strokeDasharray?: string } }[] {
  return screen.UNSAFE_getByType(Svg).props.children.props.children;
}

function arcProps() {
  return circles()[1].props as { stroke: string; strokeDasharray: string };
}

/** The drawn arc length, read back off `strokeDasharray`. */
function drawnArc(): number {
  return Number(arcProps().strokeDasharray.split(' ')[0]);
}

const theme = buildTheme('light', false);

describe('ProgressRing (US-074b)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('draws nothing at zero and the full circle at one', async () => {
    await renderRing(<ProgressRing progress={0} />);
    expect(drawnArc()).toBe(0);

    screen.unmount();
    await renderRing(<ProgressRing progress={1} />);
    const full = drawnArc();

    screen.unmount();
    await renderRing(<ProgressRing progress={0.5} />);
    expect(drawnArc()).toBeCloseTo(full / 2);
  });

  it.each([
    [-0.5, 0],
    [2, 1],
  ])('clamps a value of %s', async (progress, equivalent) => {
    await renderRing(<ProgressRing progress={progress} />);
    const clamped = drawnArc();

    screen.unmount();
    await renderRing(<ProgressRing progress={equivalent} />);
    expect(clamped).toBeCloseTo(drawnArc());
  });

  it('takes its arc color from the accent tokens', async () => {
    await renderRing(<ProgressRing progress={0.5} accent="purple" />);
    expect(arcProps().stroke).toBe(theme.accents.purple.solid);
  });

  describe('alert threshold', () => {
    it('stays on the accent color below the threshold', async () => {
      await renderRing(<ProgressRing progress={0.8} alertThreshold={0.9} />);
      expect(arcProps().stroke).toBe(theme.accents.teal.solid);
    });

    it('switches to the alert color at the threshold', async () => {
      await renderRing(<ProgressRing progress={0.9} alertThreshold={0.9} />);
      expect(arcProps().stroke).toBe(theme.accents.coral.solid);
    });

    // The arc is clamped to a full circle, but the threshold still reads the raw value.
    it('still alerts past 100%', async () => {
      await renderRing(<ProgressRing progress={1.5} alertThreshold={1} />);
      expect(arcProps().stroke).toBe(theme.accents.coral.solid);
    });

    it('lets an explicit color win over the threshold', async () => {
      await renderRing(
        <ProgressRing progress={1} alertThreshold={0.9} color={theme.colors.success} />,
      );
      expect(arcProps().stroke).toBe(theme.colors.success);
    });
  });

  it('renders the centered value and label', async () => {
    await renderRing(<ProgressRing progress={0.78} centerValue="78%" centerLabel="Atteint" />);
    expect(screen.getByText('78%')).toBeTruthy();
    expect(screen.getByText('Atteint')).toBeTruthy();
  });

  it('exposes an accessible label instead of the bare ring', async () => {
    await renderRing(<ProgressRing progress={0.78} accessibilityLabel="Objectif à 78 %" />);
    expect(screen.getByLabelText('Objectif à 78 %')).toBeTruthy();
  });

  it('sweeps clockwise in LTR', async () => {
    I18nManager.isRTL = false;
    await renderRing(<ProgressRing progress={0.5} />);
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(Svg).props.style)).toBeUndefined();
  });

  // Like the donut: the arc must sweep toward the reading side.
  it('mirrors the ring in RTL', async () => {
    I18nManager.isRTL = true;
    await renderRing(<ProgressRing progress={0.5} />);
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(Svg).props.style)).toMatchObject({
      transform: [{ scaleX: -1 }],
    });
  });

  it('takes its track from the active scheme', async () => {
    await renderRing(<ProgressRing progress={0.5} />, 'dark');
    // The track circle is the arc's sibling, rendered first.
    expect(circles()[0].props.stroke).toBe(buildTheme('dark', false).colors.surfaceAlt);
  });
});
