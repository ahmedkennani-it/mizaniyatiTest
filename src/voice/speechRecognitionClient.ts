import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { ExpoSpeechRecognitionErrorEvent, ExpoSpeechRecognitionResultEvent } from 'expo-speech-recognition';

export interface SpeechPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface StartListeningOptions {
  /** BCP-47 tag, e.g. `fr-MA` — see `recognitionLocale`. */
  lang: string;
}

export type { ExpoSpeechRecognitionErrorEvent, ExpoSpeechRecognitionResultEvent };

/** Unsubscribe function returned by every `on*` listener below. */
export type Unsubscribe = () => void;

/**
 * Narrow interface over `expo-speech-recognition` — the only native surface this app needs for
 * dictated entries. Kept narrow (mirrors `NotificationClient`/`BiometricClient`) so screens and
 * tests never touch the native module directly: it isn't available under Jest or in this sandbox,
 * only on a real device build.
 *
 * By design this never sets `recordingOptions.persist` — the package does not write an audio file
 * to disk unless asked to, which is what lets US-020b/US-021a promise "no audio is kept after
 * analysis" without any cleanup step of our own.
 */
export interface SpeechRecognitionClient {
  getPermissionsAsync(): Promise<SpeechPermissionStatus>;
  requestPermissionsAsync(): Promise<SpeechPermissionStatus>;
  start(options: StartListeningOptions): void;
  stop(): void;
  abort(): void;
  onStart(listener: () => void): Unsubscribe;
  onEnd(listener: () => void): Unsubscribe;
  onVolumeChange(listener: (rawValue: number) => void): Unsubscribe;
  onResult(listener: (event: ExpoSpeechRecognitionResultEvent) => void): Unsubscribe;
  onError(listener: (event: ExpoSpeechRecognitionErrorEvent) => void): Unsubscribe;
}

export const speechRecognitionClient: SpeechRecognitionClient = {
  async getPermissionsAsync() {
    const response = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    return { granted: response.granted, canAskAgain: response.canAskAgain };
  },
  async requestPermissionsAsync() {
    const response = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return { granted: response.granted, canAskAgain: response.canAskAgain };
  },
  start({ lang }) {
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      // Keep listening until silence stops it (our own 5s watcher) rather than the single-phrase
      // default, which would cut off mid-sentence on some platforms.
      continuous: true,
    });
  },
  stop() {
    ExpoSpeechRecognitionModule.stop();
  },
  abort() {
    ExpoSpeechRecognitionModule.abort();
  },
  onStart(listener) {
    const subscription = ExpoSpeechRecognitionModule.addListener('start', () => listener());
    return () => subscription.remove();
  },
  onEnd(listener) {
    const subscription = ExpoSpeechRecognitionModule.addListener('end', () => listener());
    return () => subscription.remove();
  },
  onVolumeChange(listener) {
    const subscription = ExpoSpeechRecognitionModule.addListener('volumechange', (event) =>
      listener(event.value),
    );
    return () => subscription.remove();
  },
  onResult(listener) {
    const subscription = ExpoSpeechRecognitionModule.addListener('result', listener);
    return () => subscription.remove();
  },
  onError(listener) {
    const subscription = ExpoSpeechRecognitionModule.addListener('error', listener);
    return () => subscription.remove();
  },
};
