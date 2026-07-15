import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createCategory } from '../categoryRepository';
import { NotFoundError } from '../errors';
import {
  createSeasonalTheme,
  getSeasonalThemeById,
  listSeasonalThemes,
  updateSeasonalTheme,
} from '../seasonalThemeRepository';

describe('seasonalThemeRepository', () => {
  it('creates an active theme by default and reads it back', async () => {
    const { db } = createFakeDatabase();

    const theme = await createSeasonalTheme(db, {
      type: 'ramadan',
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
    });

    expect(theme.active).toBe(true);
    expect(await getSeasonalThemeById(db, theme.id)).toEqual(theme);
  });

  it('rejects a negative envelope (CHECK)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createSeasonalTheme(db, {
        type: 'ramadan',
        startDate: '2027-03-01',
        endDate: '2027-03-30',
        envelopeMinor: -100,
        currencyCode: 'MAD',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists themes ordered by creation descending', async () => {
    // Fake timers force distinct `created_at` timestamps — two real-clock calls this close
    // together can land in the same millisecond, making "ORDER BY created_at DESC" ambiguous.
    jest.useFakeTimers({ now: new Date('2026-01-01T10:00:00.000Z') });
    const { db } = createFakeDatabase();
    const first = await createSeasonalTheme(db, {
      type: 'ramadan',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      envelopeMinor: 100000,
      currencyCode: 'MAD',
    });
    jest.setSystemTime(new Date('2026-01-01T10:00:01.000Z'));
    const second = await createSeasonalTheme(db, {
      type: 'ramadan',
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 200000,
      currencyCode: 'MAD',
    });

    expect((await listSeasonalThemes(db)).map((theme) => theme.id)).toEqual([second.id, first.id]);
    jest.useRealTimers();
  });

  it('updates a theme (e.g. deactivating it, adjusting dates)', async () => {
    const { db } = createFakeDatabase();
    const theme = await createSeasonalTheme(db, {
      type: 'ramadan',
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
    });

    const updated = await updateSeasonalTheme(db, theme.id, { active: false, endDate: '2027-03-29' });

    expect(updated.active).toBe(false);
    expect(updated.endDate).toBe('2027-03-29');
  });

  it('throws NotFoundError when updating an unknown theme', async () => {
    const { db } = createFakeDatabase();
    await expect(updateSeasonalTheme(db, 'missing', { active: false })).rejects.toThrow(NotFoundError);
  });

  it('lets a category be tagged with a seasonal theme id', async () => {
    const { db } = createFakeDatabase();
    const theme = await createSeasonalTheme(db, {
      type: 'ramadan',
      startDate: '2027-03-01',
      endDate: '2027-03-30',
      envelopeMinor: 750000,
      currencyCode: 'MAD',
    });

    const category = await createCategory(db, {
      name: 'Iftar & Suhoor',
      icon: 'utensils',
      color: '#0D9488',
      seasonalThemeId: theme.id,
    });

    expect(category.seasonalThemeId).toBe(theme.id);
  });

  it('rejects an unknown seasonal theme id on a category (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createCategory(db, { name: 'Iftar', icon: 'utensils', color: '#0D9488', seasonalThemeId: 'missing-theme' }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('leaves a regular category unaffected (seasonalThemeId null, no FK error)', async () => {
    const { db } = createFakeDatabase();

    const category = await createCategory(db, { name: 'Courses', icon: 'cart', color: '#1E7B34' });

    expect(category.seasonalThemeId).toBeNull();
  });
});
