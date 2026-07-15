import * as SecureStore from 'expo-secure-store';

/**
 * Narrow interface over the one thing this app needs from `expo-secure-store` (iOS Keychain /
 * Android Keystore) — get/set/delete a single string value. Kept narrow (mirrors
 * `notificationClient.ts`'s `NotificationClient`) so tests can swap in an in-memory fake instead
 * of exercising the real native module (unavailable under Jest in this sandbox — see
 * `apps/mobile/CLAUDE.md`).
 */
export interface SecureStoreClient {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export const secureStoreClient: SecureStoreClient = {
  getItem(key) {
    return SecureStore.getItemAsync(key);
  },
  setItem(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem(key) {
    return SecureStore.deleteItemAsync(key);
  },
};
