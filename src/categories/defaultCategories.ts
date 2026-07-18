import type { SupportedLanguage } from '../i18n/i18n';
import { DEFAULT_COUNTRY_CODE, marketHasModule } from '../market';

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

const SCHOOL_ICON = 'school';

const NAMES_BY_LANGUAGE: Record<SupportedLanguage, string[]> = {
  fr: [
    'Courses',
    'École',
    'Santé',
    'Transport',
    'Factures',
    'Logement',
    'Restaurants',
    'Loisirs',
    'Autres',
  ],
  ar: ['التسوق', 'المدرسة', 'الصحة', 'النقل', 'الفواتير', 'السكن', 'المطاعم', 'الترفيه', 'أخرى'],
  en: [
    'Groceries',
    'School',
    'Health',
    'Transport',
    'Bills',
    'Housing',
    'Restaurants',
    'Leisure',
    'Other',
  ],
};

/** Name only changes by language, like the base set above — icon and color are fixed (US-044). */
const ZAKAT_CATEGORY_NAMES: Record<SupportedLanguage, string> = {
  fr: 'Zakat & dons',
  ar: 'الزكاة والتبرعات',
  en: 'Zakat & donations',
};

const ZAKAT_ICON_AND_COLOR = { icon: 'hand-heart', color: '#B45309' };

/**
 * US-063: a diaspora-facing market (has the `transfers` module) gets a remittance-nudge category
 * instead of assuming a local tontine practice. A Gulf market (both `tontine` *and* `transfers` —
 * expats there send money home *and* sit in a jam'iya) gets a distinct wording from a pure-diaspora
 * one (France): "Transfert aux proches" reads as an addition alongside the household's existing
 * local habits, "Transfert famille" as the household's main way of sending money, since it has no
 * tontine at all.
 */
const REMITTANCE_ICON_AND_COLOR = { icon: 'plane', color: '#0EA5E9' };
const REMITTANCE_NAMES_DIASPORA: Record<SupportedLanguage, string> = {
  fr: 'Transfert famille',
  ar: 'تحويل للعائلة',
  en: 'Family transfer',
};
const REMITTANCE_NAMES_GULF: Record<SupportedLanguage, string> = {
  fr: 'Transfert aux proches',
  ar: 'تحويل للأقارب',
  en: 'Transfer to relatives',
};

/**
 * US-063: a Gulf market's private-school reality gets a more specific label than the base
 * "École" — same icon/color/position, name only, exactly like the base set varying by language.
 */
const SCHOOL_NAMES_GULF: Record<SupportedLanguage, string> = {
  fr: 'Écoles des enfants',
  ar: 'مدارس الأبناء',
  en: "Children's schools",
};

/**
 * The launch default category set (US-009/US-063), editable by the user afterwards like any other
 * category (name/icon/color are plain seed values, not live-translated i18n keys — renaming a
 * default category works exactly like renaming a custom one; `resolveCategoryDisplayName` handles
 * the live-retranslation case separately).
 *
 * The base 9 categories are the same everywhere, with one market-driven exception: a Gulf market
 * (both modules) relabels the "École" slot to "Écoles des enfants". On top of the base set, extras
 * are appended (never inserted mid-list, so an existing household's `orderIndex`es never shift):
 * a `tontine`-module market gets "Zakat & dons" (US-044), a `transfers`-module market gets a
 * remittance category (US-063) — a Gulf market, having both modules, gets both extras.
 */
export function getDefaultCategories(
  language: SupportedLanguage,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): DefaultCategoryDefinition[] {
  const hasTontine = marketHasModule(countryCode, 'tontine');
  const hasTransfers = marketHasModule(countryCode, 'transfers');
  const isGulf = hasTontine && hasTransfers;

  const base = NAMES_BY_LANGUAGE[language].map((name, index) => {
    const { icon, color } = ICONS_AND_COLORS[index];
    if (isGulf && icon === SCHOOL_ICON) {
      return { name: SCHOOL_NAMES_GULF[language], icon, color };
    }
    return { name, icon, color };
  });

  const extras: DefaultCategoryDefinition[] = [];
  if (hasTontine) {
    extras.push({
      name: ZAKAT_CATEGORY_NAMES[language],
      icon: ZAKAT_ICON_AND_COLOR.icon,
      color: ZAKAT_ICON_AND_COLOR.color,
    });
  }
  if (hasTransfers) {
    const remittanceNames = isGulf ? REMITTANCE_NAMES_GULF : REMITTANCE_NAMES_DIASPORA;
    extras.push({
      name: remittanceNames[language],
      icon: REMITTANCE_ICON_AND_COLOR.icon,
      color: REMITTANCE_ICON_AND_COLOR.color,
    });
  }

  return [...base, ...extras];
}

export interface CategoryNameVariant {
  icon: string;
  names: Record<SupportedLanguage, string>;
}

/**
 * Every known {fr, ar, en} name family a default category can carry, grouped by icon —
 * `resolveCategoryDisplayName` uses this to retranslate live on a language switch (US-056). Built
 * directly from the same literal tables used to seed data (not derived by calling
 * `getDefaultCategories` per market and aggregating) so two variants sharing an icon — the base
 * "École" family and the Gulf-only "Écoles des enfants" family — stay two distinct, internally
 * consistent {fr, ar, en} sets instead of getting mixed into one ambiguous per-language string.
 */
export const KNOWN_CATEGORY_NAME_VARIANTS: CategoryNameVariant[] = [
  ...ICONS_AND_COLORS.map(({ icon }, index) => ({
    icon,
    names: {
      fr: NAMES_BY_LANGUAGE.fr[index],
      ar: NAMES_BY_LANGUAGE.ar[index],
      en: NAMES_BY_LANGUAGE.en[index],
    },
  })),
  { icon: SCHOOL_ICON, names: SCHOOL_NAMES_GULF },
  { icon: ZAKAT_ICON_AND_COLOR.icon, names: ZAKAT_CATEGORY_NAMES },
  { icon: REMITTANCE_ICON_AND_COLOR.icon, names: REMITTANCE_NAMES_DIASPORA },
  { icon: REMITTANCE_ICON_AND_COLOR.icon, names: REMITTANCE_NAMES_GULF },
];
