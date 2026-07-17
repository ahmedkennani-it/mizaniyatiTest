export { VOICE_PROMO_USAGE_LIMIT, shouldShowVoicePromo } from './voicePromo';
export { SILENCE_TIMEOUT_MS, createSilenceWatcher } from './silenceWatcher';
export type { SilenceWatcher } from './silenceWatcher';
export { SILENCE_LEVEL_THRESHOLD, normalizeVolumeLevel } from './volumeLevel';
export { recognitionLocale } from './recognitionLocale';
export { extractAmountFromDictation } from './extractAmountFromDictation';
export { speechRecognitionClient } from './speechRecognitionClient';
export type {
  SpeechPermissionStatus,
  SpeechRecognitionClient,
  StartListeningOptions,
} from './speechRecognitionClient';
