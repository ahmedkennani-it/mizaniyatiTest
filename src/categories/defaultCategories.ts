import type { SupportedLanguage } from '../i18n/i18n';

export interface DefaultCategoryDefinition {
  name: string;
  icon: string;
  color: string;
}

/**
 * Icon/color pairs are shared across languages — only `name` changes. Order here is the
 * intended default display order (`orderIndex`), matching `docs/specs/categories-plafonds.md`'s
 * "courses, école, santé, transport, factures, etc." example for a Morocco launch profile.
 * Colors mirror the Mizaniyati.dc.html design system's category-ring mapping (Logement=teal,
 * Alimentation=gold, École=purple, Transport=blue, Autres=coral), extended with complementary
 * on-brand hues for the categories the design doesn't show a slice for.
 */
const ICONS_AND_COLORS: { icon: string; color: string }[] = [
  { icon: 'cart', color: '#D97706' },
  { icon: 'school', color: '#7C3AED' },
  { icon: 'health', color: '#DC2626' },
  { icon: 'car', color: '#2563EB' },
  { icon: 'receipt', color: '#4F46E5' },
  { icon: 'home', color: '#0D9488' },
  { icon: 'utensils', color: '#EA580C' },
  { icon: 'film', color: '#DB2777' },
  { icon: 'ellipsis', color: '#F43F5E' },
];

const NAMES_BY_LANGUAGE: Record<SupportedLanguage, string[]> = {
  fr: ['Courses', 'École', 'Santé', 'Transport', 'Factures', 'Logement', 'Restaurants', 'Loisirs', 'Autres'],
  ar: ['التسوق', 'المدرسة', 'الصحة', 'النقل', 'الفواتير', 'السكن', 'المطاعم', 'الترفيه', 'أخرى'],
};

/**
 * The Morocco launch default category set (US-009), editable by the user afterwards like any
 * other category (name/icon/color are plain seed values, not live-translated i18n keys — renaming
 * a default category works exactly like renaming a custom one).
 */
export function getDefaultCategories(language: SupportedLanguage): DefaultCategoryDefinition[] {
  return NAMES_BY_LANGUAGE[language].map((name, index) => ({
    name,
    icon: ICONS_AND_COLORS[index].icon,
    color: ICONS_AND_COLORS[index].color,
  }));
}
