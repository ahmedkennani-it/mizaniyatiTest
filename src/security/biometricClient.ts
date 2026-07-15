import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Narrow interface over `expo-local-authentication` — same testability-by-narrowing pattern as
 * `secureStoreClient.ts`/`notificationClient.ts`.
 */
export interface BiometricClient {
  /** Whether the device has a fingerprint/face scanner at all. */
  hasHardware(): Promise<boolean>;
  /** Whether the user has actually enrolled a fingerprint/face on this device. */
  isEnrolled(): Promise<boolean>;
  /** Prompts the OS biometric UI; resolves `true` only on a successful match. */
  authenticate(promptMessage: string): Promise<boolean>;
}

export const biometricClient: BiometricClient = {
  hasHardware() {
    return LocalAuthentication.hasHardwareAsync();
  },
  isEnrolled() {
    return LocalAuthentication.isEnrolledAsync();
  },
  async authenticate(promptMessage) {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage });
    return result.success;
  },
};
