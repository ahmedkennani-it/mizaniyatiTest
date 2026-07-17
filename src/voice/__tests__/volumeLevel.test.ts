import { normalizeVolumeLevel, SILENCE_LEVEL_THRESHOLD } from '../volumeLevel';

describe('normalizeVolumeLevel', () => {
  it('clamps the documented "inaudible" range (below 0) to zero', () => {
    expect(normalizeVolumeLevel(-2)).toBe(0);
    expect(normalizeVolumeLevel(-0.1)).toBe(0);
    expect(normalizeVolumeLevel(0)).toBe(0);
  });

  it('clamps values at or above the raw maximum (10) to one', () => {
    expect(normalizeVolumeLevel(10)).toBe(1);
    expect(normalizeVolumeLevel(15)).toBe(1);
  });

  it('scales the audible range (0..10) linearly to 0..1', () => {
    expect(normalizeVolumeLevel(5)).toBeCloseTo(0.5);
    expect(normalizeVolumeLevel(2.5)).toBeCloseTo(0.25);
  });

  it('is at the silence threshold exactly at zero', () => {
    expect(normalizeVolumeLevel(0)).toBe(SILENCE_LEVEL_THRESHOLD);
  });
});
