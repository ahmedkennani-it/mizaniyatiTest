import { createSilenceWatcher, SILENCE_TIMEOUT_MS } from '../silenceWatcher';

describe('createSilenceWatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires after 5s of silence from the start', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout);

    watcher.start();
    jest.advanceTimersByTime(SILENCE_TIMEOUT_MS - 1);
    expect(onSilenceTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSilenceTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not fire while audible volume keeps arriving', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout);

    watcher.start();
    for (let i = 0; i < 10; i += 1) {
      jest.advanceTimersByTime(SILENCE_TIMEOUT_MS - 500);
      watcher.reportVolume(0.6);
    }

    expect(onSilenceTimeout).not.toHaveBeenCalled();
  });

  it('resets the countdown on the last audible sample, not the first', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout);

    watcher.start();
    jest.advanceTimersByTime(4000);
    watcher.reportVolume(0.4); // audible — pushes the timeout back out to +5000ms from here
    jest.advanceTimersByTime(4999);
    expect(onSilenceTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSilenceTimeout).toHaveBeenCalledTimes(1);
  });

  it('treats a silent-range volume sample (0) as silence, not as resetting the timer', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout);

    watcher.start();
    jest.advanceTimersByTime(4999);
    watcher.reportVolume(0);
    jest.advanceTimersByTime(1);

    expect(onSilenceTimeout).toHaveBeenCalledTimes(1);
  });

  it('never fires once stopped, even if time keeps passing', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout);

    watcher.start();
    jest.advanceTimersByTime(1000);
    watcher.stop();
    jest.advanceTimersByTime(SILENCE_TIMEOUT_MS * 2);

    expect(onSilenceTimeout).not.toHaveBeenCalled();
  });

  it('honours a custom silence duration', () => {
    const onSilenceTimeout = jest.fn();
    const watcher = createSilenceWatcher(onSilenceTimeout, 1000);

    watcher.start();
    jest.advanceTimersByTime(999);
    expect(onSilenceTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSilenceTimeout).toHaveBeenCalledTimes(1);
  });
});
