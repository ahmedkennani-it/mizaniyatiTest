/**
 * `expo-speech-recognition`'s `volumechange` event reports a value between -2 and 10, where
 * anything below 0 is documented as inaudible. The waveform wants a plain 0..1 level, so this is
 * the single place that mapping happens — the waveform component and the silence watcher both
 * consume it instead of each guessing at the native range.
 */
const RAW_VOLUME_MIN = 0;
const RAW_VOLUME_MAX = 10;

/** Below this normalized level, the input is treated as silence. */
export const SILENCE_LEVEL_THRESHOLD = 0;

export function normalizeVolumeLevel(rawValue: number): number {
  if (rawValue <= RAW_VOLUME_MIN) {
    return 0;
  }
  if (rawValue >= RAW_VOLUME_MAX) {
    return 1;
  }
  return (rawValue - RAW_VOLUME_MIN) / (RAW_VOLUME_MAX - RAW_VOLUME_MIN);
}
