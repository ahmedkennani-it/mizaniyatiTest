import type { Category } from '../../db/repositories';
import { resolveCategoryDisplayName } from '../resolveCategoryDisplayName';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Courses',
    icon: 'cart',
    color: '#D97706',
    isDefault: true,
    orderIndex: 0,
    seasonalThemeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveCategoryDisplayName (US-056)', () => {
  it('translates a pristine default category into the active language', () => {
    expect(resolveCategoryDisplayName(category({ name: 'Courses' }), 'en')).toBe('Groceries');
    expect(resolveCategoryDisplayName(category({ name: 'Courses' }), 'ar')).toBe('التسوق');
    expect(resolveCategoryDisplayName(category({ name: 'Courses' }), 'fr')).toBe('Courses');
  });

  it('translates the Zakat default category too', () => {
    const zakat = category({ name: 'Zakat & dons', icon: 'hand-heart' });
    expect(resolveCategoryDisplayName(zakat, 'en')).toBe('Zakat & donations');
    expect(resolveCategoryDisplayName(zakat, 'ar')).toBe('الزكاة والتبرعات');
  });

  it('recognizes a default category already showing any of the 3 languages, not just the seeded one', () => {
    // A household seeded in Arabic, now switching to English, sees the Arabic name as "current".
    expect(resolveCategoryDisplayName(category({ name: 'التسوق' }), 'en')).toBe('Groceries');
  });

  it('leaves a renamed default category exactly as stored, in every language', () => {
    const renamed = category({ name: 'Épicerie du quartier' });
    expect(resolveCategoryDisplayName(renamed, 'en')).toBe('Épicerie du quartier');
    expect(resolveCategoryDisplayName(renamed, 'ar')).toBe('Épicerie du quartier');
  });

  it('never translates a non-default (custom) category, even if its name coincidentally matches', () => {
    const custom = category({ name: 'Courses', isDefault: false });
    expect(resolveCategoryDisplayName(custom, 'en')).toBe('Courses');
  });

  it('leaves a default category with an unrecognized icon untouched', () => {
    const unknownIcon = category({ name: 'Something', icon: 'unknown-icon' });
    expect(resolveCategoryDisplayName(unknownIcon, 'en')).toBe('Something');
  });

  describe('deux familles de noms sur la même icône (US-063)', () => {
    it("keeps a Morocco household's base \"École\" within the base family when retranslating", () => {
      const school = category({ name: 'École', icon: 'school' });
      expect(resolveCategoryDisplayName(school, 'en')).toBe('School');
      expect(resolveCategoryDisplayName(school, 'ar')).toBe('المدرسة');
    });

    it('keeps a Gulf household\'s "Écoles des enfants" within the Gulf family when retranslating, never falling back to "School"', () => {
      const gulfSchool = category({ name: 'Écoles des enfants', icon: 'school' });
      expect(resolveCategoryDisplayName(gulfSchool, 'en')).toBe("Children's schools");
      expect(resolveCategoryDisplayName(gulfSchool, 'ar')).toBe('مدارس الأبناء');
    });

    it('translates the diaspora and Gulf remittance categories within their own family', () => {
      const diaspora = category({ name: 'Transfert famille', icon: 'plane' });
      const gulf = category({ name: 'Transfert aux proches', icon: 'plane' });

      expect(resolveCategoryDisplayName(diaspora, 'en')).toBe('Family transfer');
      expect(resolveCategoryDisplayName(gulf, 'en')).toBe('Transfer to relatives');
    });
  });
});
