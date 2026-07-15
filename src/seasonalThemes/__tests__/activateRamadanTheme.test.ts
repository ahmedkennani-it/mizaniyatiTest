import { listCategories } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { activateRamadanTheme } from '../activateRamadanTheme';

describe('activateRamadanTheme', () => {
  it('creates an active theme with the given window and envelope', async () => {
    const { db } = createFakeDatabase();

    const { theme } = await activateRamadanTheme(db, {
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    expect(theme.type).toBe('ramadan');
    expect(theme.active).toBe(true);
    expect(theme.envelopeMinor).toBe(750000);
  });

  it('creates the four French sub-categories tagged with the theme id', async () => {
    const { db } = createFakeDatabase();

    const { theme, categories } = await activateRamadanTheme(db, {
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    expect(categories.map((c) => c.name)).toEqual([
      'Iftar & Suhoor',
      'Zakat al-Fitr',
      'Aïd & cadeaux',
      'Invités & famille',
    ]);
    expect(categories.every((c) => c.seasonalThemeId === theme.id)).toBe(true);
    expect(await listCategories(db)).toHaveLength(4);
  });

  it('creates Arabic sub-category names when the language is ar', async () => {
    const { db } = createFakeDatabase();

    const { categories } = await activateRamadanTheme(db, {
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'ar',
    });

    expect(categories.every((c) => /[؀-ۿ]/.test(c.name))).toBe(true);
  });

  it('creates a fresh set of categories per activation (no reuse across years)', async () => {
    const { db } = createFakeDatabase();

    await activateRamadanTheme(db, {
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      envelopeMinor: 500000,
      currencyCode: 'MAD',
      language: 'fr',
    });
    await activateRamadanTheme(db, {
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
      language: 'fr',
    });

    expect(await listCategories(db)).toHaveLength(8);
  });
});
