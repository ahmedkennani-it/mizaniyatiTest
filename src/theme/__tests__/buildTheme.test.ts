import { buildTheme } from '../buildTheme';
import { darkColors, lightColors } from '../tokens';

// WCAG 2.1 relative luminance + contrast ratio, used to enforce AA (>=4.5:1) at the token level.
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

const AA_NORMAL_TEXT = 4.5;

describe('buildTheme', () => {
  it('exposes light colors by default', () => {
    const theme = buildTheme('light', false);
    expect(theme.colors).toEqual(lightColors);
    expect(theme.seniorMode).toBe(false);
  });

  it('exposes dark colors when requested', () => {
    const theme = buildTheme('dark', false);
    expect(theme.colors).toEqual(darkColors);
  });

  it('scales up typography and touch targets in senior mode', () => {
    const normal = buildTheme('light', false);
    const senior = buildTheme('light', true);

    expect(senior.typography.sizes.md).toBeGreaterThan(normal.typography.sizes.md);
    expect(senior.typography.sizes.xxl).toBeGreaterThan(normal.typography.sizes.xxl);
    expect(senior.minTouchTarget).toBeGreaterThan(normal.minTouchTarget);
  });

  it('boosts secondary text contrast in senior mode', () => {
    const senior = buildTheme('light', true);
    expect(senior.colors.textSecondary).toBe(senior.colors.textPrimary);
  });

  describe('AA contrast (>=4.5:1)', () => {
    it.each([
      ['light textPrimary/background', lightColors.textPrimary, lightColors.background],
      ['light textSecondary/background', lightColors.textSecondary, lightColors.background],
      ['light primaryText/primary', lightColors.primaryText, lightColors.primary],
      ['light danger/surface', lightColors.danger, lightColors.surface],
      ['dark textPrimary/background', darkColors.textPrimary, darkColors.background],
      ['dark textSecondary/background', darkColors.textSecondary, darkColors.background],
      ['dark primaryText/primary', darkColors.primaryText, darkColors.primary],
      ['dark danger/background', darkColors.danger, darkColors.background],
    ])('%s meets AA', (_label, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });
  });
});
