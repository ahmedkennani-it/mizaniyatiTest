import type { UserSettings } from '../../db/repositories';
import { VOICE_PROMO_USAGE_LIMIT, shouldShowVoicePromo } from '../voicePromo';

function settings(patch: Partial<UserSettings> = {}): UserSettings {
  return {
    languageCode: 'fr',
    countryCode: 'MA',
    currencyCode: 'MAD',
    onboardingStep: 'privacy',
    privacyAcceptedAt: '2026-07-16T10:00:00.000Z',
    voiceEntryCount: 0,
    voicePromoDismissed: false,
    micPermissionExplainerSeen: false,
    ramadanSuggestionDismissedHijriYear: null,
    createdAt: '2026-07-16T10:00:00.000Z',
    updatedAt: '2026-07-16T10:00:00.000Z',
    ...patch,
  };
}

describe('shouldShowVoicePromo (US-014)', () => {
  it('shows to a household that has never dictated', () => {
    expect(shouldShowVoicePromo(settings())).toBe(true);
  });

  it.each([1, 2])('still shows after %s use — the point is to teach the habit', (count) => {
    expect(shouldShowVoicePromo(settings({ voiceEntryCount: count }))).toBe(true);
  });

  it('retires at the third use, when the feature has clearly been found', () => {
    expect(shouldShowVoicePromo(settings({ voiceEntryCount: VOICE_PROMO_USAGE_LIMIT }))).toBe(false);
  });

  it('stays retired beyond the limit', () => {
    expect(shouldShowVoicePromo(settings({ voiceEntryCount: 42 }))).toBe(false);
  });

  /** "No thanks" answers the question the banner asks, whatever the count. */
  it('honours a dismissal even from a household that never used voice', () => {
    expect(shouldShowVoicePromo(settings({ voicePromoDismissed: true }))).toBe(false);
  });

  it('honours a dismissal mid-way through the count', () => {
    expect(shouldShowVoicePromo(settings({ voiceEntryCount: 1, voicePromoDismissed: true }))).toBe(
      false,
    );
  });

  // The dashboard isn't reachable before onboarding stores a row, but the rule shouldn't crash.
  it('shows nothing without settings', () => {
    expect(shouldShowVoicePromo(null)).toBe(false);
  });
});
