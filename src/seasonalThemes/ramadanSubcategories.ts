import type { SupportedLanguage } from '../i18n/i18n';

export interface RamadanSubcategoryDefinition {
  name: string;
  icon: string;
  color: string;
}

/**
 * Icon/color pairs are shared across languages — only `name` changes, same convention as
 * `categories/defaultCategories.ts`. Order matches `docs/specs/mode-ramadan.md`'s list.
 */
const ICONS_AND_COLORS: { icon: string; color: string }[] = [
  { icon: 'utensils', color: '#0D9488' }, // Iftar & Suhoor
  { icon: 'moon', color: '#7C3AED' }, // Zakat al-Fitr
  { icon: 'gift', color: '#D97706' }, // Aïd & cadeaux
  { icon: 'users', color: '#2563EB' }, // Invités & famille
];

const NAMES_BY_LANGUAGE: Record<SupportedLanguage, string[]> = {
  fr: ['Iftar & Suhoor', 'Zakat al-Fitr', 'Aïd & cadeaux', 'Invités & famille'],
  ar: ['الإفطار والسحور', 'زكاة الفطر', 'العيد والهدايا', 'الضيوف والعائلة'],
  en: ['Iftar & Suhoor', 'Zakat al-Fitr', 'Eid & gifts', 'Guests & family'],
};

/** The four Ramadan sub-categories (US-026, `docs/specs/mode-ramadan.md`), in a fixed language. */
export function getRamadanSubcategories(
  language: SupportedLanguage,
): RamadanSubcategoryDefinition[] {
  return NAMES_BY_LANGUAGE[language].map((name, index) => ({
    name,
    icon: ICONS_AND_COLORS[index].icon,
    color: ICONS_AND_COLORS[index].color,
  }));
}
