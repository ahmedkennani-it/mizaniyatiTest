import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
import { getUserSettings, saveLanguageCountry, markMicPermissionExplainerSeen } from '../../db/repositories';
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

function renderSheet(options: { plan?: Plan; onClose?: () => void; onFallbackToKeyboard?: () => void } = {}) {
  const onClose = options.onClose ?? jest.fn();
  const onFallbackToKeyboard = options.onFallbackToKeyboard ?? jest.fn();
  render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <EntitlementsProvider plan={options.plan}>
          <VoiceEntrySheet onClose={onClose} onFallbackToKeyboard={onFallbackToKeyboard} />
        </EntitlementsProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
  return { onClose, onFallbackToKeyboard };
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

  it('shows the Pro upsell instead of ever touching the microphone on the free plan', async () => {
    await seedSettings(true);

    renderSheet();

    expect(await screen.findByText(fr.voiceCapture.upsellMessage)).toBeTruthy();
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

  it('falls back to the keyboard when permission is refused', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(DENIED);
    mockSpeechClient.requestPermissionsAsync.mockResolvedValue(DENIED);
    await seedSettings(true);

    const { onFallbackToKeyboard } = renderSheet({ plan: PRO_PLAN });

    expect(await screen.findByText(fr.voiceCapture.deniedTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(fr.voiceCapture.useKeyboard));

    expect(onFallbackToKeyboard).toHaveBeenCalledTimes(1);
  });

  it('closes the sheet when the recognizer ends on its own', async () => {
    mockSpeechClient.getPermissionsAsync.mockResolvedValue(GRANTED);
    await seedSettings(true);

    const { onClose } = renderSheet({ plan: PRO_PLAN });
    await screen.findByText(fr.voiceCapture.listeningLabel);

    const endListener = mockSpeechClient.onEnd.mock.calls[0][0];
    act(() => endListener());

    expect(onClose).toHaveBeenCalledTimes(1);
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
