/**
 * Fixed icon/color choices offered when creating or editing a category (US-017). Reuses the same
 * visual language as the Morocco default set (`defaultCategories.ts`) — icons are plain string
 * identifiers (no icon-font/SVG library wired up yet, that's a future visual-polish story). Colors
 * are only ever used as a small swatch/dot background (never as text), so they follow the
 * Mizaniyati.dc.html design system's category-ring palette directly rather than the stricter
 * AA-text-contrast set used for `theme.colors`.
 */
export const CATEGORY_ICON_OPTIONS: string[] = [
  'cart',
  'school',
  'health',
  'car',
  'receipt',
  'home',
  'utensils',
  'film',
  'ellipsis',
];

export const CATEGORY_COLOR_OPTIONS: string[] = [
  '#D97706',
  '#7C3AED',
  '#DC2626',
  '#2563EB',
  '#4F46E5',
  '#0D9488',
  '#EA580C',
  '#DB2777',
  '#F43F5E',
];
