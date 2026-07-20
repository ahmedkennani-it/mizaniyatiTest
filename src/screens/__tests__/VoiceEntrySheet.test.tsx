import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// `jest.mock()` factories are hoisted above every other statement in this file (including plain
// `const`s), so the fake client/watcher are built *inside* the factory rather than referenced from
// an outer variable — the latter reads as `undefined` at hoist time. The test body gets at them by
// importing the mocked bindings back out, same as any other module.
jest.mock('../../voice', () => {
  const actual = jest.requireActual('../../voice');
  return {
    ...actual,
    speechRecognitionClient: {
      getPermissionsAsync: jest.fn(),
      requestPermissionsAsync: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      onStart: jest.fn(() => () => {}),
      onEnd: jest.fn(() => () => {}),
      onVolumeChange: jest.fn(() => () => {}),
      onResult: jest.fn(() => () => {}),
      onError: jest.fn(() => () => {}),
    },
    createSilenceWatcher: jest.fn(() => ({
      start: jest.fn(),
      reportVolume: jest.fn(),
      stop: jest.fn(),
    })),
  };
});

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import {
  createCategory,
  createMember,
  createHousehold,
  getUserSettings,
  listTransactions,
  saveLanguageCountry,
  markMicPermissionExplainerSeen,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { EntitlementsProvider, PRO_PLAN } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import type { Plan } from '../../entitlements';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ar } from '../../i18n/locales/ar';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { SubscriptionProvider } from '../../subscriptions';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createSilenceWatcher, speechRecognitionClient } from '../../voice';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { VoiceEntrySheet } from '../VoiceEntrySheet';

interface MockSpeechClient {
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  abort: jest.Mock;
  onStart: jest.Mock;
  onEnd: jest.Mock;
  onVolumeChange: jest.Mock;
  onResult: jest.Mock;
  onError: jest.Mock;
}

interface MockSilenceWatcher {
  start: jest.Mock;
  reportVolume: jest.Mock;
  stop: jest.Mock;
}

const mockSpeechClient = speechRecognitionClient as unknown as MockSpeechClient;
const mockCreateSilenceWatcher = createSilenceWatcher as jest.Mock;

/** The watcher instance handed to the most recent `createSilenceWatcher(...)` call. */
function latestSilenceWatcher(): MockSilenceWatcher {
  const results = mockCreateSilenceWatcher.mock.results;
  return results[results.length - 1].value as MockSilenceWatcher;
}

/** The `onSilenceTimeout` callback passed to the most recent `createSilenceWatcher(...)` call. */
function latestOnSilenceTimeout(): () => void {
  const calls = mockCreateSilenceWatcher.mock.calls;
  return calls[calls.length - 1][0] as () => void;
}

const GRANTED = { granted: true, canAskAgain: true };
const DENIED = { granted: false, canAskAgain: true };

function renderSheet(
  options: {
    plan?: Plan;
    onClose?: () => void;
    onFallbackToKeyboard?: () => void;
    onCaptured?: (prefill: { amountInput?: string; note?: string; categoryId?: string }) => void;
    onSavedFromReview?: () => void;
  } = {},
) {
  const onClose = options.onClose ?? jest.fn();
  const onFallbackToKeyboard = options.onFallbackToKeyboard ?? jest.fn();
  const onCaptured = options.onCaptured ?? jest.fn();
  const onSavedFromReview = options.onSavedFromReview ?? jest.fn();
  render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={options.plan}>
          <SubscriptionProvider>
            <VoiceEntrySheet
              onClose={onClose}
              onFallbackToKeyboard={onFallbackToKeyboard}
              onCaptured={onCaptured}
              onSavedFromReview={onSavedFromReview}
            />
          </SubscriptionProvider>
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
  return { onClose, onFallbackToKeyboard, onCaptured, onSavedFromReview };
}

async function seedSettings(seen = false) {
  await saveLanguageCountry(mockFakeDb, { languageCode: 'fr', countryCode: 'MA', currencyCode: 'MAD' });
  if (seen) {
    await markMicPermissionExplainerSeen(mockFakeDb);
  }
}

describe('VoiceEntrySheet (US-020a)', () => {
  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
    jest.clearAllMocks();
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(DENIED);
    mockSpeechClient.requestPermissionsAsync.mockResolvedValue(DENIED);
  });

  /** US-068: a locked feature opens the paywall with itself highlighted, never the microphone. */
  it('opens the paywall with the voice row highlighted instead of ever touching the microphone on the free plan', async () => {
    await seedSettings(true);

    renderSheet();

    expect(await screen.findByText(fr.paywallScreen.title)).toBeTruthy();
    expect(screen.getByTestId('paywall-row-voice').props.style).toMatchObject({ borderWidth: 2 });
    expect(mockSpeechClient.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shows the contextual explainer on the very first use', async () => {
    await seedSettings(false);

    renderSheet({ plan: PRO_PLAN });

    expect(await screen.findByText(fr.voiceCapture.explainerTitle)).toBeTruthy();
    expect(screen.getByText(fr.voiceCapture.explainerBody)).toBeTruthy();
  });

  it('marks the explainer as seen as soon as it is shown, not only once continued', async () => {
    await seedSettings(false);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.explainerTitle);

    expect((await getUserSettings(mockFakeDb))?.micPermissionExplainerSeen).toBe(true);
  });

  it('skips the explainer once it has already been seen', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });

    expect(await screen.findByText(fr.voiceCapture.listeningLabel)).toBeTruthy();
    expect(screen.queryByText(fr.voiceCapture.explainerTitle)).toBeNull();
  });

  it('requests the permission and starts listening when the household continues', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(DENIED);
    mockSpeechClient.requestPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(false);

    renderSheet({ plan: PRO_PLAN });
    await fireEvent.press(await screen.findByText(fr.voiceCapture.explainerContinue));

    expect(await screen.findByText(fr.voiceCapture.listeningLabel)).toBeTruthy();
    expect(mockSpeechClient.start).toHaveBeenCalledWith({ lang: 'fr-MA' });
  });

  it('renders the waveform bars while listening', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });

    await screen.findByText(fr.voiceCapture.listeningLabel);
    // The waveform is decorative (hidden from the accessibility tree by design), so it must be
    // opted back in explicitly — RNTL excludes accessibility-hidden nodes from queries by default.
    expect(screen.getAllByTestId('voice-waveform-bar', { includeHiddenElements: true })).toHaveLength(
      5,
    );
  });

  /** US-020b: the transcription shows up live, not only once the recognizer settles. */
  it('shows the live transcript as results come in', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    expect(screen.queryByText('Quarante-deux dirhams')).toBeNull();

    const resultListener = mockSpeechClient.onResult.mock.calls[0][0];
    act(() =>
      resultListener({
        isFinal: false,
        results: [{ transcript: 'Quarante-deux dirhams', confidence: -1, segments: [] }],
      }),
    );

    expect(await screen.findByText('Quarante-deux dirhams')).toBeTruthy();

    act(() =>
      resultListener({
        isFinal: false,
        results: [{ transcript: 'Quarante-deux dirhams de café', confidence: -1, segments: [] }],
      }),
    );

    expect(await screen.findByText('Quarante-deux dirhams de café')).toBeTruthy();
  });

  it('clears the previous transcript when capture restarts in another language', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    const resultListener = mockSpeechClient.onResult.mock.calls[0][0];
    act(() =>
      resultListener({ isFinal: false, results: [{ transcript: 'Quarante-deux', confidence: -1, segments: [] }] }),
    );
    await screen.findByText('Quarante-deux');

    await fireEvent.press(screen.getByText(ar.language.nativeArabic));

    expect(screen.queryByText('Quarante-deux')).toBeNull();
  });

  it('falls back to the keyboard when permission is refused', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(DENIED);
    mockSpeechClient.requestPermissionsAsync.mockResolvedValue(DENIED);
    await seedSettings(true);

    const { onFallbackToKeyboard } = renderSheet({ plan: PRO_PLAN });

    expect(await screen.findByText(fr.voiceCapture.deniedTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(fr.voiceCapture.useKeyboard));

    expect(onFallbackToKeyboard).toHaveBeenCalledTimes(1);
  });

  /** US-021a: the amount is extracted and handed to the keyboard, not silently discarded. */
  /** US-021b: an amount ending the dictation goes to a review proposal, not straight to `onCaptured`. */
  describe('review proposal (US-021b)', () => {
    async function seedReview() {
      await seedSettings(true);
      await createHousehold(mockFakeDb, { name: 'Ma famille', currencyCode: 'MAD' });
      await createCategory(mockFakeDb, { name: 'Restaurants', icon: 'utensils', color: '#EA580C' });
      await createCategory(mockFakeDb, { name: 'Transport', icon: 'car', color: '#2563EB' });
      await createMember(mockFakeDb, { name: 'Moi' });
    }

    async function endWithTranscript(transcript: string) {
      const resultListener = mockSpeechClient.onResult.mock.calls[0][0];
      act(() => resultListener({ isFinal: true, results: [{ transcript, confidence: -1, segments: [] }] }));
      const endListener = mockSpeechClient.onEnd.mock.calls[0][0];
      act(() => endListener());
    }

    /** The category list and the auto-selection both load asynchronously after `end` fires —
     *  wait for the suggested chip to actually be selected, not just present, before moving on. */
    async function waitForCategorySelected(label: string) {
      await waitFor(() => {
        expect(screen.getByLabelText(label).props.accessibilityState.selected).toBe(true);
      });
    }

    it('proposes the deduced amount, label and category, marked as auto-detected', async () => {
      mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
      await seedReview();

      const { onCaptured, onClose } = renderSheet({ plan: PRO_PLAN });
      await screen.findByText(fr.voiceCapture.listeningLabel);
      await endWithTranscript('Quarante-deux dirhams de café ce matin');

      expect(await screen.findByText('Café')).toBeTruthy();
      expect(screen.getByText(fr.voiceCapture.autoDetectedBadge)).toBeTruthy();
      await waitForCategorySelected('Restaurants');
      expect(onCaptured).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('confirms the review and saves the transaction', async () => {
      mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
      await seedReview();

      const { onSavedFromReview } = renderSheet({ plan: PRO_PLAN });
      await screen.findByText(fr.voiceCapture.listeningLabel);
      await endWithTranscript('Quarante-deux dirhams de café ce matin');
      await screen.findByText('Café');
      await waitForCategorySelected('Restaurants');

      await fireEvent.press(screen.getByText(fr.voiceCapture.confirmButton));

      expect(onSavedFromReview).toHaveBeenCalledTimes(1);
      const [saved] = await listTransactions(mockFakeDb);
      expect(saved.amountMinor).toBe(4200);
      expect(saved.note).toBe('Café');
    });

    it('lets the household change the suggested category, clearing the auto-detected mention', async () => {
      mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
      await seedReview();

      renderSheet({ plan: PRO_PLAN });
      await screen.findByText(fr.voiceCapture.listeningLabel);
      await endWithTranscript('Quarante-deux dirhams de café ce matin');
      await screen.findByText('Café');
      await waitForCategorySelected('Restaurants');

      await fireEvent.press(screen.getByLabelText('Transport'));

      expect(screen.queryByText(fr.voiceCapture.autoDetectedBadge)).toBeNull();
      expect(screen.getByLabelText('Transport').props.accessibilityState.selected).toBe(true);
      expect(screen.getByLabelText('Restaurants').props.accessibilityState.selected).toBe(false);
    });

    it('cancels the review without saving, handing back to the keyboard pre-filled', async () => {
      mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
      await seedReview();

      const { onCaptured } = renderSheet({ plan: PRO_PLAN });
      await screen.findByText(fr.voiceCapture.listeningLabel);
      await endWithTranscript('Quarante-deux dirhams de café ce matin');
      await screen.findByText('Café');
      await waitForCategorySelected('Restaurants');

      await fireEvent.press(screen.getByText(fr.voiceCapture.cancelButton));

      expect(onCaptured).toHaveBeenCalledWith({
        amountInput: '42',
        note: 'Café',
        categoryId: expect.any(String),
      });
      expect(await listTransactions(mockFakeDb)).toHaveLength(0);
    });

    it('does not let Confirm save without a matching category to propose', async () => {
      mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
      // No category has the "car" icon this time — nothing to auto-select.
      await seedSettings(true);
      await createHousehold(mockFakeDb, { name: 'Ma famille', currencyCode: 'MAD' });
      await createCategory(mockFakeDb, { name: 'Restaurants', icon: 'utensils', color: '#EA580C' });
      await createMember(mockFakeDb, { name: 'Moi' });

      const { onSavedFromReview } = renderSheet({ plan: PRO_PLAN });
      await screen.findByText(fr.voiceCapture.listeningLabel);
      await endWithTranscript('Cinquante dirhams de taxi');
      await screen.findByText('Taxi');

      await fireEvent.press(screen.getByText(fr.voiceCapture.confirmButton));

      expect(onSavedFromReview).not.toHaveBeenCalled();
    });
  });

  /** US-021a: no amount detected still hands off the transcript, so nothing said is lost. */
  it('hands off with no amount but the transcript as the note when nothing is detected', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    const { onCaptured } = renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    const resultListener = mockSpeechClient.onResult.mock.calls[0][0];
    act(() =>
      resultListener({ isFinal: true, results: [{ transcript: 'Café et croissant', confidence: -1, segments: [] }] }),
    );
    const endListener = mockSpeechClient.onEnd.mock.calls[0][0];
    act(() => endListener());

    expect(onCaptured).toHaveBeenCalledWith({
      amountInput: undefined,
      note: 'Café et croissant',
    });
  });

  it('hands off with nothing pre-filled when the recognizer ends without ever hearing speech', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    const { onCaptured } = renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    const endListener = mockSpeechClient.onEnd.mock.calls[0][0];
    act(() => endListener());

    expect(onCaptured).toHaveBeenCalledWith({ amountInput: undefined, note: undefined });
  });

  it('shows a clear error and a keyboard fallback when the recognizer errors', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    const errorListener = mockSpeechClient.onError.mock.calls[0][0];
    act(() => errorListener({ error: 'network', message: 'boom' }));

    expect(await screen.findByText(fr.voiceCapture.errorTitle)).toBeTruthy();
    expect(screen.getByText(fr.voiceCapture.useKeyboard)).toBeTruthy();
  });

  it('cancels capture and closes the sheet from the listening state', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    const { onClose } = renderSheet({ plan: PRO_PLAN });
    await fireEvent.press(await screen.findByText(fr.voiceCapture.cancelButton));

    expect(mockSpeechClient.abort).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /** US-020a: recognition language follows the app language, with manual override. */
  it('defaults the recognition language to the app language', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    expect(mockSpeechClient.start).toHaveBeenCalledWith({ lang: 'fr-MA' });
  });

  it('restarts capture in the newly selected language on manual override', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    await fireEvent.press(screen.getByText(ar.language.nativeArabic));

    expect(mockSpeechClient.abort).toHaveBeenCalled();
    expect(mockSpeechClient.start).toHaveBeenLastCalledWith({ lang: 'ar-MA' });
  });

  it('feeds volume readings to the silence watcher, normalized to 0..1', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    expect(latestSilenceWatcher().start).toHaveBeenCalledTimes(1);
    const volumeListener = mockSpeechClient.onVolumeChange.mock.calls[0][0];
    act(() => volumeListener(5));

    expect(latestSilenceWatcher().reportVolume).toHaveBeenCalledWith(0.5);
  });

  /** The 5s auto-stop rule (US-020a) — the watcher's own timing is covered by its unit tests;
   *  this only checks the timeout is actually wired to stop capture. */
  it('stops capture when the silence watcher times out', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    act(() => latestOnSilenceTimeout()());

    expect(mockSpeechClient.stop).toHaveBeenCalledTimes(1);
  });
});
