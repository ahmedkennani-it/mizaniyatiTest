import { buildTheme } from '../buildTheme';
import { gradients, onAccent } from '../tokens';
import type { ColorScheme, Theme } from '../types';

// ── WCAG 2.1 contrast maths ──────────────────────────────────────────────────

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  return [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((raw) => {
    const channel = raw / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Flattens `rgba(255,255,255,a)` over an opaque ground — the real color an eye sees. */
function composite(color: string, ground: string): string {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(color);
  if (!match) {
    return color;
  }
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  const source = [Number(match[1]), Number(match[2]), Number(match[3])];
  const backdrop = channels(ground);
  const blended = source.map((value, index) =>
    Math.round(alpha * value + (1 - alpha) * backdrop[index]),
  );
  return `#${blended.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const AA_NORMAL_TEXT = 4.5;
/** WCAG 1.4.11: icons and other non-text graphics answer to a lower bar. */
const AA_NON_TEXT = 3;

/** The four themes the app ships. Ramadan is a screen-local surface, covered separately below. */
const THEMES: [string, ColorScheme, boolean][] = [
  ['light', 'light', false],
  ['dark', 'dark', false],
  ['light senior', 'light', true],
  ['dark senior', 'dark', true],
];

/** Every ground a text token can legitimately land on. */
function grounds(theme: Theme): [string, string][] {
  return [
    ['background', theme.colors.background],
    ['surface', theme.colors.surface],
    ['surfaceAlt', theme.colors.surfaceAlt],
  ];
}

/** Every token used as *text* color, by name. */
function textColors(theme: Theme): [string, string][] {
  return [
    ['textPrimary', theme.colors.textPrimary],
    ['textSecondary', theme.colors.textSecondary],
    ['textTertiary', theme.colors.textTertiary],
    ['primary', theme.colors.primary],
    ['success', theme.colors.success],
    ['warning', theme.colors.warning],
    ['danger', theme.colors.danger],
    ...(Object.entries(theme.accents) as [string, { ink: string }][]).map(
      ([name, tone]) => [`accents.${name}.ink`, tone.ink] as [string, string],
    ),
  ];
}

/**
 * US-075a: "le contraste texte/fond respecte WCAG AA (4.5:1) sur les 4 thèmes (test automatisé
 * sur les tokens)". Every text token is checked against every ground it can land on, in every
 * theme — rather than the handful of pairs someone remembered to list. This is what surfaced the
 * dark `danger` token failing on `surface` (3.98:1) and the balance gradient's light stop.
 */
describe.each(THEMES)('AA contrast — %s theme', (_name, scheme, senior) => {
  const theme = buildTheme(scheme, senior);

  const pairs = textColors(theme).flatMap(([fgName, fg]) =>
    grounds(theme).map(
      ([bgName, bg]) => [`${fgName} on ${bgName}`, fg, bg] as [string, string, string],
    ),
  );

  it.each(pairs)('%s meets AA', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('reads primaryText on the primary fill (buttons)', () => {
    expect(contrastRatio(theme.colors.primaryText, theme.colors.primary)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('reads the banner text on the banner fill', () => {
    expect(contrastRatio(theme.banner.warningText, theme.banner.warningBg)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

/** Gradient cards carry their own ground, identical in both schemes. */
describe('AA contrast — text on gradients', () => {
  const stops = Object.entries(gradients).flatMap(([name, colors]) =>
    colors.map((stop) => [`${name} @ ${stop}`, stop] as [string, string]),
  );

  it.each(stops)('on-accent text reads on %s', (_label, stop) => {
    expect(contrastRatio(onAccent.text, stop)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  // Only used on the dark `voice` gradient; decoration, so it answers to the 3:1 bar.
  it('the decorative chevron reads on the voice gradient', () => {
    for (const stop of gradients.voice) {
      expect(contrastRatio(composite(onAccent.icon, stop), stop)).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      );
    }
  });

  it('the dark badge ink reads on its light badge fill', () => {
    expect(contrastRatio(onAccent.ink, onAccent.text)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});

describe('contrast helpers', () => {
  it('computes the known black-on-white ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0F172A', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#0F172A'));
  });

  // Without compositing, a translucent white would score as opaque white and hide the failure.
  it('flattens a translucent color over its ground before measuring', () => {
    expect(composite('rgba(255,255,255,0.5)', '#000000')).toBe('#808080');
    expect(composite('rgba(255,255,255,1)', '#000000')).toBe('#ffffff');
    expect(composite('#123456', '#000000')).toBe('#123456');
  });
});
