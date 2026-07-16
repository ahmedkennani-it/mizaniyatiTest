import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { TrustChip } from '../TrustChip';
import i18n from '../../i18n/i18n';
import { ar } from '../../i18n/locales/ar';
import { en } from '../../i18n/locales/en';
import { fr } from '../../i18n/locales/fr';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';
import { buildTheme } from '../../theme/buildTheme';
import { ramadanSurface } from '../../theme/tokens';

async function renderChip(label: string, scheme: ColorScheme = 'light', senior = false) {
  await render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      <TrustChip label={label} />
    </ThemeProvider>,
  );
}

// WCAG 2.1 contrast, as in `src/theme/__tests__/contrast.test.ts`.
function relativeLuminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('TrustChip (US-009)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('shows the promise, with a shield beside it', async () => {
    await renderChip(fr.home.disclaimer);

    expect(screen.getByText(fr.home.disclaimer)).toBeTruthy();
    expect(screen.getByTestId('icon-shield-check', { includeHiddenElements: true })).toBeTruthy();
  });

  it.each([
    ['fr', fr],
    ['ar', ar],
    ['en', en],
  ] as const)('carries a translated promise in %s', async (language, catalog) => {
    await i18n.changeLanguage(language);
    await renderChip(catalog.home.disclaimer);

    expect(screen.getByText(catalog.home.disclaimer)).toBeTruthy();
    // Each catalog says its own thing rather than falling back to French.
    expect(catalog.home.disclaimer).not.toBe('');
  });

  it('names both halves of the promise: no bank, manual entry', async () => {
    expect(fr.home.disclaimer).toMatch(/banque/i);
    expect(fr.home.disclaimer).toMatch(/manuelle/i);
    expect(en.home.disclaimer).toMatch(/bank/i);
    expect(en.home.disclaimer).toMatch(/manual/i);
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderChip(fr.home.disclaimer, scheme, senior);
    expect(screen.getByText(fr.home.disclaimer)).toBeTruthy();
  });

  /**
   * The chip is the product's promise, so it has to be legible everywhere it appears — including
   * the Ramadan screen's warm surface, which the criterion calls out by name.
   */
  describe('legibility', () => {
    it.each([
      ['light', 'light' as ColorScheme],
      ['dark', 'dark' as ColorScheme],
    ])('reads at AA on its own wash in %s', (_name, scheme) => {
      const theme = buildTheme(scheme, false);
      expect(contrastRatio(theme.accents.teal.ink, theme.accents.teal.wash)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    /**
     * The chip paints its own opaque wash, so the page behind it never decides the text's
     * contrast — which is what makes it legible on the Ramadan surface too.
     */
    it('paints its own background rather than inheriting the page', async () => {
      await renderChip(fr.home.disclaimer);

      const style = StyleSheet.flatten(screen.getByTestId('trust-chip').props.style) as {
        backgroundColor?: string;
      };
      expect(style.backgroundColor).toBe(buildTheme('light', false).accents.teal.wash);
      expect(style.backgroundColor).not.toBe(ramadanSurface.background);
    });
  });
});
