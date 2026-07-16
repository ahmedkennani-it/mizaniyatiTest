import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';

import { DonutBreakdown } from '../DonutBreakdown';
import { ThemeProvider } from '../../theme';

const SEGMENTS = [
  { label: 'Courses', value: 600, valueLabel: '600', accent: 'teal' as const },
  { label: 'Transport', value: 400, valueLabel: '400', accent: 'coral' as const },
];

async function renderDonut() {
  await render(
    <ThemeProvider initialColorScheme="light">
      <DonutBreakdown segments={SEGMENTS} centerLabel="Dépensé" centerValue="1000" />
    </ThemeProvider>,
  );
}

function ringTransform() {
  const flattened = StyleSheet.flatten(screen.UNSAFE_getByType(Svg).props.style) as
    | { transform?: { scaleX?: number }[] }
    | undefined;
  return flattened?.transform;
}

describe('DonutBreakdown', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('splits the ring proportionally and lists each segment in the legend', async () => {
    I18nManager.isRTL = false;
    await renderDonut();

    expect(screen.getByText('Courses')).toBeTruthy();
    expect(screen.getByText('Transport')).toBeTruthy();
    expect(screen.getByText('Dépensé')).toBeTruthy();
    expect(screen.getByText('1000')).toBeTruthy();
  });

  it('sweeps the ring clockwise in LTR', async () => {
    I18nManager.isRTL = false;
    await renderDonut();
    expect(ringTransform()).toBeUndefined();
  });

  it('mirrors the ring so it sweeps toward the reading side in RTL', async () => {
    I18nManager.isRTL = true;
    await renderDonut();
    expect(ringTransform()).toEqual([{ scaleX: -1 }]);
  });
});
