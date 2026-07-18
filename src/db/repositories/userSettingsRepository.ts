import { NotFoundError } from './errors';
import type { SqlDatabase } from '../types';
import type { NewUserSettings, UserSettings } from './types';

const USER_SETTINGS_ID = 'default';

interface UserSettingsRow {
  language_code: string;
  country_code: string;
  currency_code: string;
  onboarding_step: string;
  privacy_accepted_at: string | null;
  voice_entry_count: number | null;
  voice_promo_dismissed: number | null;
  mic_permission_explainer_seen: number | null;
  ramadan_suggestion_dismissed_hijri_year: number | null;
  origin_country_code: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'language_code, country_code, currency_code, onboarding_step, privacy_accepted_at, voice_entry_count, voice_promo_dismissed, mic_permission_explainer_seen, ramadan_suggestion_dismissed_hijri_year, origin_country_code, created_at, updated_at';

function fromRow(row: UserSettingsRow): UserSettings {
  return {
    languageCode: row.language_code as UserSettings['languageCode'],
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    onboardingStep: row.onboarding_step as UserSettings['onboardingStep'],
    // `?? null`: a row inserted before migration 0016 has no such column at all.
    privacyAcceptedAt: row.privacy_accepted_at ?? null,
    voiceEntryCount: row.voice_entry_count ?? 0,
    voicePromoDismissed: Boolean(row.voice_promo_dismissed),
    micPermissionExplainerSeen: Boolean(row.mic_permission_explainer_seen),
    ramadanSuggestionDismissedHijriYear: row.ramadan_suggestion_dismissed_hijri_year ?? null,
    originCountryCode: row.origin_country_code ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `null` means onboarding hasn't been completed yet — `App.tsx`'s startup gate reads this. */
export async function getUserSettings(db: SqlDatabase): Promise<UserSettings | null> {
  const row = await db.getFirstAsync<UserSettingsRow>(
    `SELECT ${SELECT_COLUMNS} FROM user_settings WHERE id = ?;`,
    [USER_SETTINGS_ID],
  );
  return row ? fromRow(row) : null;
}

/**
 * Persists the "langue & pays" onboarding step (US-023) — the only step this story builds.
 * Find-or-create by the fixed id, same convention as `upsertSubscription`.
 */
export async function saveLanguageCountry(
  db: SqlDatabase,
  input: NewUserSettings,
): Promise<UserSettings> {
  const now = new Date().toISOString();
  const existing = await getUserSettings(db);
  const updated: UserSettings = {
    languageCode: input.languageCode,
    countryCode: input.countryCode,
    currencyCode: input.currencyCode,
    onboardingStep: 'language_country',
    // Never cleared here: re-running this step must not erase an acceptance already given.
    privacyAcceptedAt: existing?.privacyAcceptedAt ?? null,
    voiceEntryCount: existing?.voiceEntryCount ?? 0,
    voicePromoDismissed: existing?.voicePromoDismissed ?? false,
    micPermissionExplainerSeen: existing?.micPermissionExplainerSeen ?? false,
    ramadanSuggestionDismissedHijriYear: existing?.ramadanSuggestionDismissedHijriYear ?? null,
    originCountryCode: existing?.originCountryCode ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing) {
    await db.runAsync(
      'UPDATE user_settings SET language_code = ?, country_code = ?, currency_code = ?, onboarding_step = ?, updated_at = ? WHERE id = ?;',
      [
        updated.languageCode,
        updated.countryCode,
        updated.currencyCode,
        updated.onboardingStep,
        updated.updatedAt,
        USER_SETTINGS_ID,
      ],
    );
  } else {
    await db.runAsync(
      'INSERT INTO user_settings (id, language_code, country_code, currency_code, onboarding_step, privacy_accepted_at, voice_entry_count, voice_promo_dismissed, mic_permission_explainer_seen, ramadan_suggestion_dismissed_hijri_year, origin_country_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        USER_SETTINGS_ID,
        updated.languageCode,
        updated.countryCode,
        updated.currencyCode,
        updated.onboardingStep,
        updated.privacyAcceptedAt,
        updated.voiceEntryCount,
        updated.voicePromoDismissed ? 1 : 0,
        updated.micPermissionExplainerSeen ? 1 : 0,
        updated.ramadanSuggestionDismissedHijriYear,
        updated.originCountryCode,
        updated.createdAt,
        updated.updatedAt,
      ],
    );
  }
  return updated;
}

/**
 * Records that the household accepted the privacy commitments, at `acceptedAt` (US-004).
 *
 * The timestamp is the whole point of the story: it is what distinguishes a promise that was
 * shown and acknowledged from one that was assumed. An existing acceptance is **kept** rather
 * than overwritten — the date that matters is the first one, and re-entering the screen must not
 * quietly rewrite history.
 */
export async function acceptPrivacy(db: SqlDatabase, acceptedAt = new Date().toISOString()) {
  const existing = await getUserSettings(db);
  if (!existing) {
    throw new NotFoundError('user_settings', USER_SETTINGS_ID);
  }
  if (existing.privacyAcceptedAt) {
    return existing;
  }

  const updated: UserSettings = {
    ...existing,
    onboardingStep: 'privacy',
    privacyAcceptedAt: acceptedAt,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync(
    'UPDATE user_settings SET onboarding_step = ?, privacy_accepted_at = ?, updated_at = ? WHERE id = ?;',
    [updated.onboardingStep, updated.privacyAcceptedAt, updated.updatedAt, USER_SETTINGS_ID],
  );
  return updated;
}

/** Records that the household dictated a transaction (US-014) — the banner retires itself at 3. */
export async function recordVoiceEntry(db: SqlDatabase): Promise<UserSettings> {
  const existing = await requireSettings(db);
  const updated: UserSettings = {
    ...existing,
    voiceEntryCount: existing.voiceEntryCount + 1,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync('UPDATE user_settings SET voice_entry_count = ?, updated_at = ? WHERE id = ?;', [
    updated.voiceEntryCount,
    updated.updatedAt,
    USER_SETTINGS_ID,
  ]);
  return updated;
}

/** Records that the household closed the voice discovery banner (US-014). */
export async function dismissVoicePromo(db: SqlDatabase): Promise<UserSettings> {
  const existing = await requireSettings(db);
  const updated: UserSettings = {
    ...existing,
    voicePromoDismissed: true,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync(
    'UPDATE user_settings SET voice_promo_dismissed = ?, updated_at = ? WHERE id = ?;',
    [1, updated.updatedAt, USER_SETTINGS_ID],
  );
  return updated;
}

/**
 * Records that the household has seen the "why we need the microphone" explainer (US-020a), so
 * the next mic tap skips straight to the OS permission prompt / capture instead of repeating it.
 */
export async function markMicPermissionExplainerSeen(db: SqlDatabase): Promise<UserSettings> {
  const existing = await requireSettings(db);
  const updated: UserSettings = {
    ...existing,
    micPermissionExplainerSeen: true,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync(
    'UPDATE user_settings SET mic_permission_explainer_seen = ?, updated_at = ? WHERE id = ?;',
    [1, updated.updatedAt, USER_SETTINGS_ID],
  );
  return updated;
}

/**
 * Records that the household dismissed the "activate Ramadan mode?" dashboard suggestion for a
 * given approximate Hijri year (US-041) — stored per-year so the suggestion resurfaces next year
 * rather than being silenced forever after one dismissal.
 */
export async function dismissRamadanSuggestion(
  db: SqlDatabase,
  hijriYear: number,
): Promise<UserSettings> {
  const existing = await requireSettings(db);
  const updated: UserSettings = {
    ...existing,
    ramadanSuggestionDismissedHijriYear: hijriYear,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync(
    'UPDATE user_settings SET ramadan_suggestion_dismissed_hijri_year = ?, updated_at = ? WHERE id = ?;',
    [hijriYear, updated.updatedAt, USER_SETTINGS_ID],
  );
  return updated;
}

/**
 * Configures the diaspora household's "pays d'origine" (US-064) — independent of the household's
 * own country/currency (`countryCode`/`currencyCode`, set by `saveLanguageCountry`), since a
 * household can live in one country and send money to a different one.
 */
export async function setOriginCountry(
  db: SqlDatabase,
  originCountryCode: string | null,
): Promise<UserSettings> {
  const existing = await requireSettings(db);
  const updated: UserSettings = {
    ...existing,
    originCountryCode,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync('UPDATE user_settings SET origin_country_code = ?, updated_at = ? WHERE id = ?;', [
    originCountryCode,
    updated.updatedAt,
    USER_SETTINGS_ID,
  ]);
  return updated;
}

async function requireSettings(db: SqlDatabase): Promise<UserSettings> {
  const existing = await getUserSettings(db);
  if (!existing) {
    throw new NotFoundError('user_settings', USER_SETTINGS_ID);
  }
  return existing;
}
