import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  acceptPrivacy,
  dismissVoicePromo,
  getUserSettings,
  recordVoiceEntry,
  saveLanguageCountry,
} from '../userSettingsRepository';

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

/** US-004: the acceptance timestamp is what separates a promise acknowledged from one assumed. */
describe('acceptPrivacy', () => {
  async function seed(db: ReturnType<typeof createFakeDatabase>['db']) {
    await saveLanguageCountry(db, { languageCode: 'fr', countryCode: 'MA', currencyCode: 'MAD' });
  }

  it('starts with no acceptance recorded', async () => {
    const { db } = createFakeDatabase();
    await seed(db);

    expect((await getUserSettings(db))?.privacyAcceptedAt).toBeNull();
  });

  it('records the timestamp and advances the onboarding step', async () => {
    const { db } = createFakeDatabase();
    await seed(db);

    const accepted = await acceptPrivacy(db, '2026-07-16T10:00:00.000Z');

    expect(accepted.privacyAcceptedAt).toBe('2026-07-16T10:00:00.000Z');
    expect(accepted.onboardingStep).toBe('privacy');
    expect(await getUserSettings(db)).toMatchObject({
      privacyAcceptedAt: '2026-07-16T10:00:00.000Z',
      onboardingStep: 'privacy',
    });
  });

  // The date that matters is the first one — re-entering the screen must not rewrite history.
  it('keeps the first acceptance rather than overwriting it', async () => {
    const { db } = createFakeDatabase();
    await seed(db);
    await acceptPrivacy(db, '2026-07-16T10:00:00.000Z');

    await acceptPrivacy(db, '2026-08-01T12:00:00.000Z');

    expect((await getUserSettings(db))?.privacyAcceptedAt).toBe('2026-07-16T10:00:00.000Z');
  });

  it('never clears an acceptance when the language & country step is re-run', async () => {
    const { db } = createFakeDatabase();
    await seed(db);
    await acceptPrivacy(db, '2026-07-16T10:00:00.000Z');

    await saveLanguageCountry(db, { languageCode: 'ar', countryCode: 'MA', currencyCode: 'MAD' });

    expect((await getUserSettings(db))?.privacyAcceptedAt).toBe('2026-07-16T10:00:00.000Z');
  });

  it('refuses to record an acceptance with no settings row to attach it to', async () => {
    const { db } = createFakeDatabase();
    await expect(acceptPrivacy(db)).rejects.toThrow(NotFoundError);
  });
});

/** US-014: the banner retires itself once voice has been found, or refused. */
describe('voice promo state', () => {
  async function seed(db: ReturnType<typeof createFakeDatabase>['db']) {
    await saveLanguageCountry(db, { languageCode: 'fr', countryCode: 'MA', currencyCode: 'MAD' });
  }

  it('starts at zero uses, not dismissed', async () => {
    const { db } = createFakeDatabase();
    await seed(db);

    expect(await getUserSettings(db)).toMatchObject({
      voiceEntryCount: 0,
      voicePromoDismissed: false,
    });
  });

  it('counts each dictated transaction', async () => {
    const { db } = createFakeDatabase();
    await seed(db);

    await recordVoiceEntry(db);
    await recordVoiceEntry(db);

    expect((await getUserSettings(db))?.voiceEntryCount).toBe(2);
  });

  it('records a dismissal', async () => {
    const { db } = createFakeDatabase();
    await seed(db);

    await dismissVoicePromo(db);

    expect((await getUserSettings(db))?.voicePromoDismissed).toBe(true);
  });

  /** Dismissing is not using: folding them would credit the household with voice it never used. */
  it('keeps the count and the dismissal independent', async () => {
    const { db } = createFakeDatabase();
    await seed(db);
    await recordVoiceEntry(db);

    await dismissVoicePromo(db);

    expect(await getUserSettings(db)).toMatchObject({
      voiceEntryCount: 1,
      voicePromoDismissed: true,
    });
  });

  it('never clears the voice state when the language & country step is re-run', async () => {
    const { db } = createFakeDatabase();
    await seed(db);
    await recordVoiceEntry(db);
    await dismissVoicePromo(db);

    await saveLanguageCountry(db, { languageCode: 'ar', countryCode: 'MA', currencyCode: 'MAD' });

    expect(await getUserSettings(db)).toMatchObject({
      voiceEntryCount: 1,
      voicePromoDismissed: true,
    });
  });

  it('refuses to record voice state with no settings row', async () => {
    const { db } = createFakeDatabase();
    await expect(recordVoiceEntry(db)).rejects.toThrow(NotFoundError);
    await expect(dismissVoicePromo(db)).rejects.toThrow(NotFoundError);
  });
});
