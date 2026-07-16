import type { UserSettings } from '../db/repositories';

/**
 * How many dictated transactions retire the banner. It is a discovery aid: by the third time, the
 * household has found the feature, and a permanent ad for something they already use is clutter.
 */
export const VOICE_PROMO_USAGE_LIMIT = 3;

/**
 * Whether the voice discovery banner still earns its place on the dashboard (US-014).
 *
 * Two independent ways to retire it: the household **used** voice enough to have found it, or it
 * **closed** the banner. The dismissal is honoured whatever the count — someone who says "no
 * thanks" has answered the question the banner asks.
 */
export function shouldShowVoicePromo(settings: UserSettings | null): boolean {
  if (!settings) {
    // No settings row means onboarding hasn't finished; the dashboard isn't reachable yet anyway.
    return false;
  }
  return !settings.voicePromoDismissed && settings.voiceEntryCount < VOICE_PROMO_USAGE_LIMIT;
}
