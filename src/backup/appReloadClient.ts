import * as Updates from 'expo-updates';

/**
 * Narrow interface over `expo-updates` — same testability-by-narrowing pattern as
 * `secureStoreClient.ts`/`biometricClient.ts`. After a restore (US-071b) the household/members/
 * categories a running session already loaded (contexts, `App.tsx`'s startup reads) are stale; a
 * full JS reload is the simplest way for every screen to pick up the restored data without
 * threading a manual refresh through each provider. Not supported in every environment (e.g. Expo
 * Go) — callers fall back to a "restart the app" message if `reload()` rejects.
 */
export interface AppReloadClient {
  reload(): Promise<void>;
}

export const appReloadClient: AppReloadClient = {
  async reload() {
    await Updates.reloadAsync();
  },
};
