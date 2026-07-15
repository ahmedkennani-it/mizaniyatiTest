import * as Notifications from 'expo-notifications';

export interface BudgetAlertContent {
  title: string;
  body: string;
}

/**
 * Narrow interface over the one thing this app needs from `expo-notifications` — present a local
 * notification right now. Kept narrow (mirrors `SqlDatabase` in `db/types.ts`) so tests can swap in
 * a fake instead of exercising the real native module (unavailable on real hardware in this
 * sandbox — same constraint as `expo-sqlite`, see `apps/mobile/CLAUDE.md`).
 */
export interface NotificationClient {
  presentNow(content: BudgetAlertContent): Promise<void>;
}

export const notificationClient: NotificationClient = {
  async presentNow(content) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      if (requested.status !== 'granted') {
        return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: content.title, body: content.body },
      // `null` trigger = present immediately, no scheduling/background task involved.
      trigger: null,
    });
  },
};
