import { buildTheme } from '../buildTheme';
import {
  darkColors,
  fontFamilies,
  lightAccents,
  lightColors,
  ramadanSurface,
  seniorFontScale,
} from '../tokens';

/**
 * US-073 pins the exact palette the mockups were drawn from. Asserting the literal hexes here is
 * the point: it is the one place a value may be written twice, so that changing a brand color is a
 * deliberate two-file edit rather than a silent drift on one screen.
 */
describe('design palette (US-073)', () => {
  it('defines the surface and background tokens', () => {
    expect(lightColors.background).toBe('#F0FDF4');
    expect(lightColors.surface).toBe('#FFFFFF');
  });

  it('defines the three text tones', () => {
    expect(lightColors.textPrimary).toBe('#0F172A');
    expect(lightColors.textSecondary).toBe('#334155');
  });

  /**
   * Where a design swatch fails WCAG AA, the token takes the closest passing shade of the same hue
   * — the rule `primary` (teal-700, not teal-600) and `danger` (rose-700) already follow. These
   * assertions exist so the deviation stays deliberate: the exact ratios live in `contrast.test.ts`.
   */
  it('darkens the third text tone off its design swatch to clear AA', () => {
    expect(lightColors.textTertiary).not.toBe('#64748B');
    expect(lightColors.textTertiary).toBe('#5F6F87');
  });

  it('lightens dark danger off its design swatch to clear AA on a dark card', () => {
    expect(darkColors.danger).not.toBe('#F43F5E');
    expect(darkColors.danger).toBe('#FB7185');
  });

  it('defines the teal family, including the dark shade and the wash', () => {
    expect(lightAccents.teal.solid).toBe('#0D9488');
    expect(lightAccents.teal.ink).toBe('#0F766E');
    expect(lightAccents.teal.wash).toBe('#CCFBF1');
  });

  it.each([
    ['gold', '#D97706'],
    ['coral', '#F43F5E'],
    ['purple', '#7C3AED'],
    ['blue', '#2563EB'],
  ] as const)('defines the %s accent', (name, hex) => {
    expect(lightAccents[name].solid).toBe(hex);
  });

  it('uses Outfit for latin and IBM Plex Sans Arabic for arabic', () => {
    expect(fontFamilies.latin.regular).toBe('Outfit_400Regular');
    expect(fontFamilies.latin.extrabold).toBe('Outfit_800ExtraBold');
    expect(fontFamilies.arabic.regular).toBe('IBMPlexSansArabic_400Regular');
    // IBM Plex Sans Arabic ships no 800 weight, so extrabold intentionally reuses bold.
    expect(fontFamilies.arabic.extrabold).toBe('IBMPlexSansArabic_700Bold');
  });
});

/** Every theme must be an override of the same token set — never its own hardcoded values. */
describe('themes are token overrides (US-073)', () => {
  it('light and dark differ only by swapping the token set, not the shape', () => {
    expect(Object.keys(buildTheme('dark', false).colors).sort()).toEqual(
      Object.keys(buildTheme('light', false).colors).sort(),
    );
    expect(darkColors.background).not.toBe(lightColors.background);
  });

  it('senior mode overrides the base tokens rather than replacing them', () => {
    const normal = buildTheme('light', false);
    const senior = buildTheme('light', true);

    // The dimmer text tones collapse onto the primary one; everything else is untouched.
    expect(senior.colors.textSecondary).toBe(normal.colors.textPrimary);
    expect(senior.colors.textTertiary).toBe(normal.colors.textPrimary);
    expect(senior.colors.background).toBe(normal.colors.background);
    expect(senior.typography.sizes.md).toBe(Math.round(normal.typography.sizes.md * seniorFontScale));
  });

  it('exposes the Ramadan seasonal surface as tokens', () => {
    expect(ramadanSurface.background).toBe('#FBF6EC');
    expect(ramadanSurface.accentGold).toBe('#FCD34D');
  });

  it('carries the on-accent, shadow and banner families through the theme', () => {
    const theme = buildTheme('light', false);
    expect(theme.onAccent.text).toBe('#FFFFFF');
    expect(theme.shadows.primary).toBe('#0D9488');
    expect(theme.banner.warningBg).toBe('#FFF1F2');
    // The banner family flips with the scheme, like `colors` and `accents`.
    expect(buildTheme('dark', false).banner.warningBg).not.toBe(theme.banner.warningBg);
  });
});
