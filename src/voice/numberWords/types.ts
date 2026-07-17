/** A multi-token phrase whose value isn't the sum of its parts (e.g. French "quatre-vingt" = 4×20,
 *  not 4+20). Matched longest-first before the additive pass runs. */
export interface NumberCompound {
  tokens: string[];
  value: number;
}

/**
 * Per-language number-word vocabulary. Deliberately bounded to what a spoken expense amount
 * realistically needs (0..999,999, one decimal group for cents) rather than a complete grammar —
 * see each language file's own comment for what it does and doesn't cover.
 */
export interface NumberWordLexicon {
  compounds: NumberCompound[];
  /** Single-token values — plain units plus any tens that combine additively (no `compounds` entry needed). */
  words: Record<string, number>;
  hundredWords: string[];
  thousandWords: string[];
  /** Pure connectors ("et"/"and"/"و") — skipped without affecting the running total. */
  conjunctions: string[];
  /** Words that separate the integer part from the cents, e.g. "virgule"/"point"/"فاصلة". */
  decimalConnectors: string[];
  /** Attached conjunction prefixes to strip before a word lookup (Arabic's "و" is normally
   *  written fused to the next word: "وأربعون", not "و أربعون"). */
  attachedPrefixes?: string[];
}
