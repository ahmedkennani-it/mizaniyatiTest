import type { SqlDatabase } from '../types';
import type { NotificationSettings } from './types';

/** Single fixed-id row — there is only ever one household's notification settings on-device. */
const SETTINGS_ID = 'default';

interface NotificationSettingsRow {
  id: string;
  budget_alerts_enabled: number;
}

const DEFAULTS: NotificationSettings = { budgetAlertsEnabled: false };

/**
 * Reads the opt-in notification settings, defaulting to `{ budgetAlertsEnabled: false }` (opt-in,
 * per `.claude/rules/privacy-security.md`) when no row has been saved yet — mirrors `freePlan.ts`'s
 * "lazy in-memory default, no forced write" approach rather than seeding a row at app startup.
 */
export async function getNotificationSettings(db: SqlDatabase): Promise<NotificationSettings> {
  const row = await db.getFirstAsync<NotificationSettingsRow>(
    'SELECT id, budget_alerts_enabled FROM notification_settings WHERE id = ?;',
    [SETTINGS_ID],
  );
  if (!row) {
    return DEFAULTS;
  }
  return { budgetAlertsEnabled: row.budget_alerts_enabled === 1 };
}

export async function setBudgetAlertsEnabled(
  db: SqlDatabase,
  enabled: boolean,
): Promise<NotificationSettings> {
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<NotificationSettingsRow>(
    'SELECT id, budget_alerts_enabled FROM notification_settings WHERE id = ?;',
    [SETTINGS_ID],
  );
  if (existing) {
    await db.runAsync(
      'UPDATE notification_settings SET budget_alerts_enabled = ?, updated_at = ? WHERE id = ?;',
      [enabled ? 1 : 0, now, SETTINGS_ID],
    );
  } else {
    await db.runAsync(
      'INSERT INTO notification_settings (id, budget_alerts_enabled, created_at, updated_at) VALUES (?, ?, ?, ?);',
      [SETTINGS_ID, enabled ? 1 : 0, now, now],
    );
  }
  return { budgetAlertsEnabled: enabled };
}
