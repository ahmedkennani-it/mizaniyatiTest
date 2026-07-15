import {
  baseTypography,
  darkAccents,
  darkColors,
  defaultMinTouchTarget,
  fontFamilies,
  gradients,
  lightAccents,
  lightColors,
  radius,
  seniorFontScale,
  seniorMinTouchTarget,
  spacing,
} from './tokens';
import type { ColorScheme, Theme } from './types';

/**
 * Senior mode forces the secondary (lower-contrast) text color up to the
 * primary text color, since it exists purely for AA contrast in normal mode.
 */
export function buildTheme(colorScheme: ColorScheme, seniorMode: boolean): Theme {
  const baseColors = colorScheme === 'dark' ? darkColors : lightColors;
  const fontScale = seniorMode ? seniorFontScale : 1;

  return {
    colorScheme,
    seniorMode,
    colors: seniorMode ? { ...baseColors, textSecondary: baseColors.textPrimary } : baseColors,
    accents: colorScheme === 'dark' ? darkAccents : lightAccents,
    gradients,
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
