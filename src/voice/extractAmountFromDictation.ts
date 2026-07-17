import { AR_NUMBER_WORDS, EN_NUMBER_WORDS, FR_NUMBER_WORDS } from './numberWords';
import type { NumberWordLexicon } from './numberWords';
import type { SupportedLanguage } from '../i18n';

const LEXICON_BY_LANGUAGE: Record<SupportedLanguage, NumberWordLexicon> = {
  fr: FR_NUMBER_WORDS,
  en: EN_NUMBER_WORDS,
  ar: AR_NUMBER_WORDS,
};

type NodeKind = 'value' | 'hundred' | 'thousand' | 'conjunction' | 'decimal' | 'other';

interface Node {
  kind: NodeKind;
  value?: number;
}

function mergeCompounds(tokens: string[], lexicon: NumberWordLexicon): (string | number)[] {
  const compoundsByLength = [...lexicon.compounds].sort((a, b) => b.tokens.length - a.tokens.length);
  const merged: (string | number)[] = [];
  let i = 0;
  outer: while (i < tokens.length) {
    for (const compound of compoundsByLength) {
      const { tokens: compoundTokens, value } = compound;
      if (tokens.slice(i, i + compoundTokens.length).join(' ') === compoundTokens.join(' ')) {
        merged.push(value);
        i += compoundTokens.length;
        continue outer;
      }
    }
    merged.push(tokens[i]);
    i += 1;
  }
  return merged;
}

function classifyWord(token: string, lexicon: NumberWordLexicon): Node {
  if (Object.prototype.hasOwnProperty.call(lexicon.words, token)) {
    return { kind: 'value', value: lexicon.words[token] };
  }
  if (lexicon.hundredWords.includes(token)) {
    return { kind: 'hundred' };
  }
  if (lexicon.thousandWords.includes(token)) {
    return { kind: 'thousand' };
  }
  if (lexicon.conjunctions.includes(token)) {
    return { kind: 'conjunction' };
  }
  if (lexicon.decimalConnectors.includes(token)) {
    return { kind: 'decimal' };
  }
  for (const prefix of lexicon.attachedPrefixes ?? []) {
    if (token.startsWith(prefix) && token.length > prefix.length) {
      const stripped = classifyWord(token.slice(prefix.length), lexicon);
      if (stripped.kind !== 'other') {
        return stripped;
      }
    }
  }
  return { kind: 'other' };
}

function classify(tokens: (string | number)[], lexicon: NumberWordLexicon): Node[] {
  return tokens.map((token) =>
    typeof token === 'number' ? { kind: 'value', value: token } : classifyWord(token, lexicon),
  );
}

/** The first maximal run of non-`other` nodes that contains at least one value/multiplier. */
function longestRelevantRun(nodes: Node[]): Node[] | null {
  let start = -1;
  for (let i = 0; i <= nodes.length; i += 1) {
    const isBoundary = i === nodes.length || nodes[i].kind === 'other';
    if (!isBoundary && start === -1) {
      start = i;
    } else if (isBoundary && start !== -1) {
      const run = nodes.slice(start, i);
      if (run.some((node) => node.kind === 'value' || node.kind === 'hundred' || node.kind === 'thousand')) {
        return run;
      }
      start = -1;
    }
  }
  return null;
}

function combineIntegerRun(run: Node[]): number | null {
  let total = 0;
  let current = 0;
  let sawValue = false;
  for (const node of run) {
    if (node.kind === 'value') {
      current += node.value ?? 0;
      sawValue = true;
    } else if (node.kind === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
      sawValue = true;
    } else if (node.kind === 'thousand') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      sawValue = true;
    }
    // 'conjunction' and 'decimal' (only reached here for the fractional half) are pure no-ops.
  }
  if (!sawValue) {
    return null;
  }
  return total + current;
}

function combineRun(run: Node[]): number | null {
  const decimalIndex = run.findIndex((node) => node.kind === 'decimal');
  if (decimalIndex === -1) {
    return combineIntegerRun(run);
  }
  const integerPart = combineIntegerRun(run.slice(0, decimalIndex));
  // The fractional half is read as a literal two-digit cents value ("virgule cinquante" = ,50),
  // the way people actually say prices — not as a fraction of a unit.
  const fractionalPart = combineIntegerRun(run.slice(decimalIndex + 1));
  if (integerPart === null && fractionalPart === null) {
    return null;
  }
  return (integerPart ?? 0) + (fractionalPart ?? 0) / 100;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/[.,،؛!؟?]/g, ''))
    .filter((token) => token.length > 0);
}

/**
 * Extracts a spoken amount (major currency units, e.g. `42` or `42.5`) from a dictated sentence —
 * "Quarante-deux dirhams de café" → `42`. Tries a literal digit substring first (a recognizer may
 * transcribe the number as digits even mid-sentence), then falls back to the language's spelled-out
 * number words (US-021a). Returns `null` when no amount can be found — callers fall back to the
 * keyboard with whatever else was understood (the note) pre-filled, per US-021a.
 */
export function extractAmountFromDictation(text: string, language: SupportedLanguage): number | null {
  const digitMatch = text.match(/\d+(?:[.,]\d+)?/);
  if (digitMatch) {
    const value = Number(digitMatch[0].replace(',', '.'));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const lexicon = LEXICON_BY_LANGUAGE[language];
  const tokens = tokenize(text);
  const merged = mergeCompounds(tokens, lexicon);
  const nodes = classify(merged, lexicon);
  const run = longestRelevantRun(nodes);
  if (!run) {
    return null;
  }
  const value = combineRun(run);
  return value !== null && value > 0 ? value : null;
}
