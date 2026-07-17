import { SILENCE_LEVEL_THRESHOLD } from './volumeLevel';

/** Auto-stop threshold for the listening screen (US-020a): 5s of continuous silence. */
export const SILENCE_TIMEOUT_MS = 5000;

export interface SilenceWatcher {
  /** Arms the timeout — call once listening actually starts. */
  start(): void;
  /** Feed it every normalized (0..1) volume reading; audible levels push the timeout back out. */
  reportVolume(level: number): void;
  /** Disarms the timeout — call on manual stop/cancel/unmount so it doesn't fire after the fact. */
  stop(): void;
}

/**
 * A single re-armable timer: any audible sample resets the 5s countdown, so the callback only
 * fires after 5 **consecutive** silent seconds, not 5 seconds since listening began. Uses the
 * ambient `setTimeout`/`clearTimeout` on purpose (no injected clock) — tests drive it with Jest's
 * fake timers, same as the rest of the codebase's timer-based logic.
 */
export function createSilenceWatcher(
  onSilenceTimeout: () => void,
  silenceMs: number = SILENCE_TIMEOUT_MS,
): SilenceWatcher {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function arm() {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(onSilenceTimeout, silenceMs);
  }

  function disarm() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    start: arm,
    reportVolume(level: number) {
      if (level > SILENCE_LEVEL_THRESHOLD) {
        arm();
      }
    },
    stop: disarm,
  };
}
