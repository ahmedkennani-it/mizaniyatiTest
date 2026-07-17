import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

export interface VoiceWaveformProps {
  /** Normalized input level, 0 (silence) to 1 (loud) — see `normalizeVolumeLevel`. */
  level: number;
}

// Relative heights per bar so the strip reads as a waveform rather than a single meter, tallest in
// the middle — purely cosmetic, unrelated to the actual per-bar audio content.
const BAR_WEIGHTS = [0.45, 0.75, 1, 0.75, 0.45];
const BAR_MIN_HEIGHT = 6;
const BAR_MAX_HEIGHT = 32;

/**
 * Sound-reactive waveform for the voice listening screen (US-020a: "une forme d'onde réactive au
 * niveau sonore"). Deterministic from `level` alone — no animation library, no internal state — so
 * a test can assert bar heights directly for a given prop instead of racing an animation.
 */
export function VoiceWaveform({ level }: VoiceWaveformProps) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, level));

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BAR_WEIGHTS.map((weight, index) => {
        const height = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * clamped * weight;
        return (
          <View
            key={index}
            testID="voice-waveform-bar"
            style={[
              styles.bar,
              {
                height,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.sm,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: BAR_MAX_HEIGHT,
  },
  bar: {
    width: 6,
  },
});
