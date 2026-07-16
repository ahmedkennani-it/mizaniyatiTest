export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  full: 999,
} as const;

// Sourced from the Mizaniyati.dc.html design system (mini design-system panel + dashboard
// mockups). Contrast ratios below are verified against WCAG 2.1 AA (>=4.5:1 for normal text)
// in src/theme/__tests__/buildTheme.test.ts — the design's own lighter/brighter swatches (e.g.
// teal-600 #0D9488, coral #F43F5E on white) fail that bar, so `primary`/`danger` use the
// closest AA-safe shade from the same hue family instead (teal-700, rose-700); the lighter
// swatches remain available as decorative accents (category colors, gradients, icon tints).
export const lightColors = {
  background: '#F0FDF4',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F6',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  // The design's third text tone. AA-safe on `surface`/`background` (4.76:1 / 4.55:1) but **not**
  // on `surfaceAlt` (4.23:1) — reserve it for text on white/background grounds. `textSecondary`
  // is the safe choice everywhere else.
  textTertiary: '#64748B',
  primary: '#0F766E',
  primaryText: '#FFFFFF',
  success: '#1E7B34',
  warning: '#8A5300',
  danger: '#BE123C',
} as const;

export const darkColors = {
  background: '#0B1120',
  surface: '#1E293B',
  surfaceAlt: '#243248',
  border: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  // Dark counterpart of light's `textTertiary`, carrying the same constraint: AA on `surface`
  // (4.80:1) and `background` (6.18:1), but not on `surfaceAlt` (4.24:1).
  textTertiary: '#8595AC',
  primary: '#5EEAD4',
  primaryText: '#04312C',
  success: '#79D98C',
  warning: '#F2B84B',
  danger: '#F43F5E',
} as const;

export const baseTypography = {
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 20,
  fontSizeXl: 24,
  fontSizeXxl: 32,
  lineHeightMultiplier: 1.4,
  weightRegular: '400' as const,
  weightMedium: '600' as const,
  weightBold: '700' as const,
};

// Senior mode: larger type scale + a single high-contrast text color (see buildTheme).
export const seniorFontScale = 1.3;
export const defaultMinTouchTarget = 44;
export const seniorMinTouchTarget = 56;

// ── Fonts ────────────────────────────────────────────────────────────────────
// Family names as registered by `@expo-google-fonts/*` (the export key = the runtime
// `fontFamily` string). Latin/numbers use Outfit; Arabic uses IBM Plex Sans Arabic — the active
// family is picked per-language by `useAppFont()` (reads the global i18n language), not by
// `buildTheme`, so `ThemeProvider` stays usable without a `LanguageProvider` (some tests mount it
// alone). IBM Plex Sans Arabic ships no 800 weight, so `extrabold` reuses bold there.
export const fontFamilies = {
  latin: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
    extrabold: 'Outfit_800ExtraBold',
  },
  arabic: {
    regular: 'IBMPlexSansArabic_400Regular',
    medium: 'IBMPlexSansArabic_500Medium',
    semibold: 'IBMPlexSansArabic_600SemiBold',
    bold: 'IBMPlexSansArabic_700Bold',
    extrabold: 'IBMPlexSansArabic_700Bold',
  },
} as const;

// ── Accents ──────────────────────────────────────────────────────────────────
// Category/decorative accent families from the mockup — `solid` (icon/graph color), `wash`
// (IconTile background), `ink` (accent text on a surface, kept AA-safe on white in light mode).
// Used by IconTile / ProgressBar / DonutBreakdown; distinct from the semantic `colors` tokens.
export const lightAccents = {
  teal: { solid: '#0D9488', wash: '#CCFBF1', ink: '#0F766E' },
  gold: { solid: '#D97706', wash: '#FEF3E2', ink: '#B45309' },
  coral: { solid: '#F43F5E', wash: '#FFE4E6', ink: '#BE123C' },
  purple: { solid: '#7C3AED', wash: '#F1E9FE', ink: '#6D28D9' },
  blue: { solid: '#2563EB', wash: '#E8EFFE', ink: '#1D4ED8' },
} as const;

export const darkAccents = {
  teal: { solid: '#5EEAD4', wash: '#134E4A', ink: '#5EEAD4' },
  gold: { solid: '#FBBF24', wash: '#422006', ink: '#FBBF24' },
  coral: { solid: '#FB7185', wash: '#4C1D24', ink: '#FB7185' },
  purple: { solid: '#C4B5FD', wash: '#2E1065', ink: '#C4B5FD' },
  blue: { solid: '#93C5FD', wash: '#1E3A8A', ink: '#93C5FD' },
} as const;

// ── On-accent ────────────────────────────────────────────────────────────────
// Text/decoration sitting on a saturated brand ground — a gradient hero card, the FAB, a solid
// accent tile. The ground there is the accent itself, not `surface`, so these stay fixed across
// light and dark, unlike the `colors` tokens. White-on-teal/purple clears AA at every alpha below.
export const onAccent = {
  text: '#FFFFFF',
  textStrong: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.85)',
  textSubtle: 'rgba(255,255,255,0.8)',
  textFaint: 'rgba(255,255,255,0.75)',
  icon: 'rgba(255,255,255,0.6)',
  /** Chip/divider fill on an accent ground. */
  fill: 'rgba(255,255,255,0.22)',
  /** Barely-there decorative blob. */
  veil: 'rgba(255,255,255,0.08)',
  /** Dark ink for a light badge sitting on a dark accent ground (e.g. the voice card's "NOUVEAU"). */
  ink: '#04312C',
  /** Gold used for the corner glyph of the Ramadan/tontine hero cards. */
  accentGold: '#FCD34D',
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────
// iOS shadow colors. `neutral` is the mockup's soft card elevation; `primary` tints the shadow
// under teal-filled controls (primary Button, FAB) so it reads as a glow rather than dirt.
export const shadowColors = {
  neutral: '#0F172A',
  primary: '#0D9488',
} as const;

// ── Banner tones ─────────────────────────────────────────────────────────────
// `AlertBanner`'s rose warning card from the mockup. Kept as its own token family rather than
// derived from `accents.coral`, whose `wash` is too saturated to carry body text at AA.
export const lightBanner = {
  warningBg: '#FFF1F2',
  warningBorder: '#FECDD3',
  warningText: '#9F1239',
} as const;

export const darkBanner = {
  warningBg: '#4C1D24',
  warningBorder: '#7F1D2E',
  warningText: '#FDA4AF',
} as const;

// ── Gradients ────────────────────────────────────────────────────────────────
// Color stops for `expo-linear-gradient` hero cards / FAB. Direction is set at the call site
// (mirrored for RTL). Balance/voice/fab read well on both light and dark grounds, so they're
// shared; only surfaces around them change with the scheme.
export const gradients = {
  balance: ['#0F766E', '#0D9488'],
  tontine: ['#7C3AED', '#6D28D9'],
  ramadan: ['#1E293B', '#0F766E'],
  voice: ['#0F172A', '#134E4A'],
  fab: ['#0D9488', '#0F766E'],
} as const;

// Warm seasonal surface used by the Ramadan screen (applied locally there, not app-wide).
export const ramadanSurface = {
  background: '#FBF6EC',
  border: '#EADFC8',
  accentGold: '#FCD34D',
  accentInk: '#92722F',
} as const;
