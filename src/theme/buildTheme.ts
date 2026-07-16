import {
  baseTypography,
  darkAccents,
  darkBanner,
  darkColors,
  defaultMinTouchTarget,
  fontFamilies,
  gradients,
  lightAccents,
  lightBanner,
  lightColors,
  onAccent,
  radius,
  seniorFontScale,
  seniorMinTouchTarget,
  shadowColors,
  spacing,
} from './tokens';
import type { ColorScheme, Theme } from './types';

/**
 * Senior mode collapses the two dimmer text tones onto the primary one: they exist to establish
 * visual hierarchy at normal sizes, and that hierarchy is worth less than raw legibility here.
 */
export function buildTheme(colorScheme: ColorScheme, seniorMode: boolean): Theme {
  const baseColors = colorScheme === 'dark' ? darkColors : lightColors;
  const fontScale = seniorMode ? seniorFontScale : 1;

  return {
    colorScheme,
    seniorMode,
    colors: seniorMode
      ? { ...baseColors, textSecondary: baseColors.textPrimary, textTertiary: baseColors.textPrimary }
      : baseColors,
    accents: colorScheme === 'dark' ? darkAccents : lightAccents,
    gradients,
    onAccent,
    shadows: shadowColors,
    banner: colorScheme === 'dark' ? darkBanner : lightBanner,
    fonts: fontFamilies,
    spacing,
    radius,
    typography: {
      sizes: {
        xs: Math.round(baseTypography.fontSizeXs * fontScale),
        sm: Math.round(baseTypography.fontSizeSm * fontScale),
        md: Math.round(baseTypography.fontSizeMd * fontScale),
        lg: Math.round(baseTypography.fontSizeLg * fontScale),
        xl: Math.round(baseTypography.fontSizeXl * fontScale),
        xxl: Math.round(baseTypography.fontSizeXxl * fontScale),
      },
      lineHeightMultiplier: baseTypography.lineHeightMultiplier,
      weightRegular: baseTypography.weightRegular,
      weightMedium: baseTypography.weightMedium,
      weightBold: baseTypography.weightBold,
    },
    minTouchTarget: seniorMode ? seniorMinTouchTarget : defaultMinTouchTarget,
  };
}
