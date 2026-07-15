import type { SqlDatabase } from '../types';
import type { NewUserSettings, UserSettings } from './types';

const USER_SETTINGS_ID = 'default';

interface UserSettingsRow {
  language_code: string;
  country_code: string;
  currency_code: string;
  onboarding_step: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS = 'language_code, country_code, currency_code, onboarding_step, created_at, updated_at';

function fromRow(row: UserSettingsRow): UserSettings {
  return {
    languageCode: row.language_code as UserSettings['languageCode'],
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    onboardingStep: row.onboarding_step as UserSettings['onboardingStep'],
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
export async function saveLanguageCountry(db: SqlDatabase, input: NewUserSettings): Promise<UserSettings> {
  const now = new Date().toISOString();
  const existing = await getUserSettings(db);
  const updated: UserSettings = {
    languageCode: input.languageCode,
    countryCode: input.countryCode,
    currencyCode: input.currencyCode,
    onboardingStep: 'language_country',
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
      'INSERT INTO user_settings (id, language_code, country_code, currency_code, onboarding_step, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        USER_SETTINGS_ID,
        updated.languageCode,
        updated.countryCode,
        updated.currencyCode,
        updated.onboardingStep,
        updated.createdAt,
        updated.updatedAt,
      ],
    );
  }
  return updated;
}
