import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SOURCE_ROOT = join(__dirname, '..', '..');

/**
 * Layers that *render*. Everything here must take its colors from `theme` — a literal here is the
 * visual drift US-073 exists to prevent.
 *
 * `src/theme` itself is excluded (it *is* the token definitions), as are the domain modules that
 * store colors as **data** rather than style: a category's color is a user-chosen value persisted
 * in SQLite (`categoryPalette`, `defaultCategories`, `ramadanSubcategories`) and `categoryVisual`
 * maps those stored hexes back to accent names.
 */
const RENDERING_DIRECTORIES = ['components', 'screens', 'navigation'];

const COLOR_LITERAL = /#[0-9A-Fa-f]{3,8}\b|\brgba?\s*\(/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

/** Drops `//` and `/* *​/` comments, so a hex quoted in a doc comment isn't a violation. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const files = RENDERING_DIRECTORIES.flatMap((directory) =>
  sourceFiles(join(SOURCE_ROOT, directory)).map(
    (path) => [path.slice(SOURCE_ROOT.length + 1), path] as const,
  ),
);

describe('no component hardcodes a color outside the tokens (US-073)', () => {
  it('scans every rendering source file', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files)('%s', (_relative, path) => {
    const code = stripComments(readFileSync(path, 'utf8'));
    expect(code).not.toMatch(COLOR_LITERAL);
  });
});
