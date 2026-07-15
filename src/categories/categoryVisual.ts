import type { IconName } from '../components/Icon';
import type { AccentName } from '../theme';

/**
 * Maps a category's stored `icon` string to a real Lucide `IconName`. Handles both the legacy seed
 * identifiers (`cart`, `school`, …, from before an icon library was wired up) and any value that is
 * already a valid `IconName` (categories created through the updated picker store those directly).
 * Unknown values fall back to a neutral tag icon so a stored category never renders blank.
 */
const LEGACY_ICON_TO_NAME: Record<string, IconName> = {
  cart: 'shopping-cart',
  school: 'graduation-cap',
  health: 'heart-pulse',
  car: 'car-taxi-front',
  receipt: 'banknote',
  home: 'house',
  utensils: 'utensils',
  film: 'party-popper',
  ellipsis: 'layout-grid',
};

// The icon names offered in the create/edit picker (all valid `IconName`s).
export const CATEGORY_ICON_NAMES: IconName[] = [
  'shopping-cart',
  'graduation-cap',
  'heart-pulse',
  'car-taxi-front',
  'banknote',
  'house',
  'utensils',
  'party-popper',
  'hand-heart',
  'gift',
  'plane',
  'moon-star',
  'layout-grid',
];

export function categoryIconName(icon: string): IconName {
  if (icon in LEGACY_ICON_TO_NAME) {
    return LEGACY_ICON_TO_NAME[icon];
  }
  if (CATEGORY_ICON_NAMES.includes(icon as IconName)) {
    return icon as IconName;
  }
  return 'tag';
}

/**
 * Maps a category's stored `color` hex to the nearest design accent family (drives its IconTile
 * wash + tint). The category-picker colors and legacy seed colors both resolve here; anything
 * unrecognized falls back to teal (the brand accent).
 */
const COLOR_TO_ACCENT: Record<string, AccentName> = {
  '#D97706': 'gold',
  '#EA580C': 'gold',
  '#7C3AED': 'purple',
  '#4F46E5': 'purple',
  '#DC2626': 'coral',
  '#F43F5E': 'coral',
  '#DB2777': 'coral',
  '#2563EB': 'blue',
  '#0D9488': 'teal',
};

// One representative hex per accent, offered in the create/edit color picker.
export const CATEGORY_ACCENT_COLORS: string[] = ['#0D9488', '#D97706', '#F43F5E', '#7C3AED', '#2563EB'];

export function categoryAccent(color: string): AccentName {
  return COLOR_TO_ACCENT[color.toUpperCase()] ?? COLOR_TO_ACCENT[color] ?? 'teal';
}
