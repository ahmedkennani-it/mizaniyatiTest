/**
 * Stands in for `expo-speech-recognition` under Jest — it's a native module with no JS
 * implementation to fall back on off-device (unlike the Expo SDK modules `jest-expo` already
 * mocks). `src/voice/speechRecognitionClient.ts` is the only file that imports it directly, and
 * every screen/hook built on top of that client mocks the client itself in tests (same pattern as
 * `notificationClient`/`biometricClient`) — this mock only exists so an accidental transitive
 * import never crashes a suite that didn't mean to touch it.
 */
function notImplemented() {
  return Promise.resolve({ granted: false, canAskAgain: true, expires: 'never', status: 'denied' });
}

const ExpoSpeechRecognitionModule = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  getPermissionsAsync: jest.fn(notImplemented),
  requestPermissionsAsync: jest.fn(notImplemented),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

module.exports = {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent: jest.fn(),
};
