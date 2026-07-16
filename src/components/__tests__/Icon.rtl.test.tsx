import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import { ThemeProvider } from '../../theme';

async function renderIcon(name: IconName) {
  await render(
    <ThemeProvider initialColorScheme="light">
      <Icon name={name} />
    </ThemeProvider>,
  );
  return screen.getByTestId(`icon-${name}`);
}

function isMirrored(element: ReturnType<typeof screen.getByTestId>): boolean {
  const flattened = StyleSheet.flatten(element.props.style) as
    | { transform?: { scaleX?: number }[] }
    | undefined;
  return flattened?.transform?.some((entry) => entry.scaleX === -1) ?? false;
}

/**
 * US-061b: an arrow or chevron encodes a reading direction and must point the other way in Arabic,
 * while a glyph that merely depicts an object (a house, a clock) must not — a mirrored clock reads
 * as a broken icon, not a localized one.
 */
describe('Icon mirroring', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  const directional: IconName[] = ['chevron-left', 'chevron-right', 'arrow-up-right'];
  const nonDirectional: IconName[] = ['house', 'clock', 'user', 'plus', 'lock'];

  it.each(directional)('mirrors %s under RTL', async (name) => {
    I18nManager.isRTL = true;
    expect(isMirrored(await renderIcon(name))).toBe(true);
  });

  it.each(nonDirectional)('leaves %s unmirrored under RTL', async (name) => {
    I18nManager.isRTL = true;
    expect(isMirrored(await renderIcon(name))).toBe(false);
  });

  it.each([...directional, ...nonDirectional])('leaves %s unmirrored under LTR', async (name) => {
    I18nManager.isRTL = false;
    expect(isMirrored(await renderIcon(name))).toBe(false);
  });
});
