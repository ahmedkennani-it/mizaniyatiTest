import { render, screen } from '@testing-library/react-native';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { TextField } from '../../components/TextField';
import { Txt } from '../../components/Txt';
import { ThemeProvider } from '../ThemeContext';
import { buildTheme } from '../buildTheme';
import { seniorFontScale } from '../tokens';

const SOURCE_ROOT = join(__dirname, '..', '..');
const RENDERING_DIRECTORIES = ['components', 'screens', 'navigation'];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

const files = RENDERING_DIRECTORIES.flatMap((directory) =>
  sourceFiles(join(SOURCE_ROOT, directory)).map(
    (path) => [path.slice(SOURCE_ROOT.length + 1), path] as const,
  ),
);

/**
 * US-075a: "l'app suit le Dynamic Type / font scale système". React Native honours the OS font
 * scale on `Text` by default, so following it is a matter of **not opting out** — which is exactly
 * what these two props do. Capping the multiplier is the subtler of the two: it silently stops
 * scaling partway, so a user at 200% gets less than they asked for.
 */
describe('nothing opts out of the system font scale', () => {
  it.each(files)('%s', (_relative, path) => {
    const code = readFileSync(path, 'utf8');
    expect(code).not.toMatch(/allowFontScaling\s*=\s*\{?\s*false/);
    expect(code).not.toMatch(/maxFontSizeMultiplier/);
  });
});

describe('type scale', () => {
  it('scales every step up in senior mode', () => {
    const normal = buildTheme('light', false).typography.sizes;
    const senior = buildTheme('light', true).typography.sizes;

    for (const step of Object.keys(normal) as (keyof typeof normal)[]) {
      expect(senior[step]).toBe(Math.round(normal[step] * seniorFontScale));
    }
  });

  it('grows the minimum touch target alongside the type', () => {
    expect(buildTheme('light', true).minTouchTarget).toBeGreaterThan(
      buildTheme('light', false).minTouchTarget,
    );
  });
});

/**
 * Layouts have to *grow* with the text rather than clip it. Fixed `height` on a text-bearing box is
 * the usual way that breaks, so the interactive components size themselves with `minHeight`.
 */
describe('text-bearing components grow with their text', () => {
  async function renderSenior(element: React.ReactElement) {
    await render(
      <ThemeProvider initialColorScheme="light" initialSeniorMode>
        {element}
      </ThemeProvider>,
    );
  }

  it('sizes a Button with minHeight, never a fixed height', async () => {
    await renderSenior(<Button label="Valider" onPress={() => {}} />);
    const style = StyleSheet.flatten(screen.getByRole('button').props.style) as Record<
      string,
      unknown
    >;

    expect(style.minHeight).toBe(buildTheme('light', true).minTouchTarget);
    expect(style.height).toBeUndefined();
  });

  it('sizes a Chip with minHeight, never a fixed height', async () => {
    await renderSenior(<Chip label="Courses" selected={false} onPress={() => {}} />);
    const style = StyleSheet.flatten(screen.getByRole('button').props.style) as Record<
      string,
      unknown
    >;

    expect(style.minHeight).toBe(buildTheme('light', true).minTouchTarget);
    expect(style.height).toBeUndefined();
  });

  it('renders a form field at the senior scale without dropping its label', async () => {
    await renderSenior(<TextField label="Montant" placeholder="0" />);
    expect(screen.getByLabelText('Montant')).toBeTruthy();
  });

  it('renders text at the senior size', async () => {
    await renderSenior(<Txt size="md">Solde</Txt>);
    const style = StyleSheet.flatten(screen.getByText('Solde').props.style) as {
      fontSize?: number;
    };
    expect(style.fontSize).toBe(buildTheme('light', true).typography.sizes.md);
  });
});
