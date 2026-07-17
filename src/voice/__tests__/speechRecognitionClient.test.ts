import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { speechRecognitionClient } from '../speechRecognitionClient';

const mockModule = ExpoSpeechRecognitionModule as unknown as {
  start: jest.Mock;
  stop: jest.Mock;
  abort: jest.Mock;
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  addListener: jest.Mock;
};

describe('speechRecognitionClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** US-020b/US-021a: no audio recording survives the analysis. */
  it('never asks the native module to persist an audio recording', () => {
    speechRecognitionClient.start({ lang: 'fr-MA' });

    const options = mockModule.start.mock.calls[0][0];
    expect(options.recordingOptions).toBeUndefined();
    expect(options.audioSource).toBeUndefined();
  });

  it('starts with the requested language, interim results on, continuous listening', () => {
    speechRecognitionClient.start({ lang: 'ar-MA' });

    expect(mockModule.start).toHaveBeenCalledWith({
      lang: 'ar-MA',
      interimResults: true,
      continuous: true,
    });
  });

  it('delegates stop and abort straight through', () => {
    speechRecognitionClient.stop();
    speechRecognitionClient.abort();

    expect(mockModule.stop).toHaveBeenCalledTimes(1);
    expect(mockModule.abort).toHaveBeenCalledTimes(1);
  });

  it('maps the permission response down to granted/canAskAgain', async () => {
    mockModule.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: false,
      expires: 'never',
      status: 'granted',
    });

    await expect(speechRecognitionClient.getPermissionsAsync()).resolves.toEqual({
      granted: true,
      canAskAgain: false,
    });
  });

  it('maps the permission request response the same way', async () => {
    mockModule.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: 'never',
      status: 'denied',
    });

    await expect(speechRecognitionClient.requestPermissionsAsync()).resolves.toEqual({
      granted: false,
      canAskAgain: true,
    });
  });

  it('subscribes/unsubscribes volume changes through addListener', () => {
    const remove = jest.fn();
    mockModule.addListener.mockReturnValue({ remove });
    const listener = jest.fn();

    const unsubscribe = speechRecognitionClient.onVolumeChange(listener);
    const [eventName, nativeListener] = mockModule.addListener.mock.calls[0];
    expect(eventName).toBe('volumechange');

    nativeListener({ value: 4.2 });
    expect(listener).toHaveBeenCalledWith(4.2);

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('subscribes to error and result events by their native event name', () => {
    mockModule.addListener.mockReturnValue({ remove: jest.fn() });

    speechRecognitionClient.onError(jest.fn());
    speechRecognitionClient.onResult(jest.fn());

    const eventNames = mockModule.addListener.mock.calls.map((call) => call[0]);
    expect(eventNames).toEqual(expect.arrayContaining(['error', 'result']));
  });
});
