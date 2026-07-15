import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { getUserSettings, saveLanguageCountry } from '../userSettingsRepository';

describe('userSettingsRepository', () => {
  it('returns null when onboarding has never been completed', async () => {
    const { db } = createFakeDatabase();
    expect(await getUserSettings(db)).toBeNull();
  });

  it('creates the row on first save and reads it back', async () => {
    const { db } = createFakeDatabase();

    const settings = await saveLanguageCountry(db, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });

    expect(settings.languageCode).toBe('fr');
    expect(settings.countryCode).toBe('MA');
    expect(settings.currencyCode).toBe('MAD');
    expect(settings.onboardingStep).toBe('language_country');
    expect(await getUserSettings(db)).toEqual(settings);
  });

  it('overwrites the single row on a second save, preserving createdAt', async () => {
    const { db } = createFakeDatabase();
    const first = await saveLanguageCountry(db, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });

    const second = await saveLanguageCountry(db, {
      languageCode: 'ar',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });

    expect(second.languageCode).toBe('ar');
    expect(second.createdAt).toBe(first.createdAt);
    expect(await getUserSettings(db)).toEqual(second);
  });
});
