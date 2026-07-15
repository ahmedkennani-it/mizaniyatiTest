import { gradients, radius, spacing } from './tokens';

export type ColorScheme = 'light' | 'dark';

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type FontFamilySet = Record<FontWeightName, string>;

export interface FontTokens {
  latin: FontFamilySet;
  arabic: FontFamilySet;
}

/** One decorative accent family: `solid` graphic color, `wash` tile bg, `ink` accent text. */
export interface AccentTone {
  solid: string;
  wash: string;
  ink: string;
}

export type AccentName = 'teal' | 'gold' | 'coral' | 'purple' | 'blue';
export type AccentTokens = Record<AccentName, AccentTone>;

export type GradientName = keyof typeof gradients;
export type GradientTokens = Record<GradientName, readonly string[]>;

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
}

export interface TypographySizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface TypographyTokens {
  sizes: TypographySizes;
  lineHeightMultiplier: number;
  weightRegular: '400';
  weightMedium: '600';
  weightBold: '700';
}

export interface Theme {
  colorScheme: ColorScheme;
  seniorMode: boolean;
  colors: ColorTokens;
  accents: AccentTokens;
  gradients: GradientTokens;
  fonts: FontTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: TypographyTokens;
  minTouchTarget: number;
}
