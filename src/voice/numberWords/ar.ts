import type { NumberWordLexicon } from './types';

/**
 * Arabic number words 0..999,999 — pragmatically bounded, not a full grammar. Modern Standard
 * Arabic inflects numbers for gender and grammatical case (تسعٌ / تسعَ / تسعِ, عشرون / عشرين…); this
 * accepts the common spoken variants rather than modeling case agreement, and does not attempt the
 * fused hundreds forms ("ثلاثمائة" as one word) — only the spoken-apart form ("ثلاثة مئة"/"ثلاث مئة").
 * "عشر" is deliberately absent from `words`: on its own it means 10, but it's also the second half
 * of every 11..19 compound below, and "أحد"/"إحدى" ("one" in that context only, never a standalone
 * "1") only make sense paired with it — so 11..19 are listed as explicit compounds rather than
 * relying on addition, unlike the regular 20..99 range.
 */
export const AR_NUMBER_WORDS: NumberWordLexicon = {
  compounds: [
    { tokens: ['أحد', 'عشر'], value: 11 },
    { tokens: ['إحدى', 'عشر'], value: 11 },
    { tokens: ['اثنا', 'عشر'], value: 12 },
    { tokens: ['اثنتا', 'عشر'], value: 12 },
    { tokens: ['ثلاثة', 'عشر'], value: 13 },
    { tokens: ['ثلاث', 'عشرة'], value: 13 },
    { tokens: ['أربعة', 'عشر'], value: 14 },
    { tokens: ['أربع', 'عشرة'], value: 14 },
    { tokens: ['خمسة', 'عشر'], value: 15 },
    { tokens: ['خمس', 'عشرة'], value: 15 },
    { tokens: ['ستة', 'عشر'], value: 16 },
    { tokens: ['ست', 'عشرة'], value: 16 },
    { tokens: ['سبعة', 'عشر'], value: 17 },
    { tokens: ['سبع', 'عشرة'], value: 17 },
    { tokens: ['ثمانية', 'عشر'], value: 18 },
    { tokens: ['ثماني', 'عشرة'], value: 18 },
    { tokens: ['تسعة', 'عشر'], value: 19 },
    { tokens: ['تسع', 'عشرة'], value: 19 },
  ],
  words: {
    صفر: 0,
    واحد: 1,
    واحدة: 1,
    اثنان: 2,
    اثنين: 2,
    اثنتان: 2,
    اثنتين: 2,
    ثلاثة: 3,
    ثلاث: 3,
    أربعة: 4,
    أربع: 4,
    خمسة: 5,
    خمس: 5,
    ستة: 6,
    ست: 6,
    سبعة: 7,
    سبع: 7,
    ثمانية: 8,
    ثماني: 8,
    ثمان: 8,
    تسعة: 9,
    تسع: 9,
    عشرة: 10,
    عشر: 10,
    عشرون: 20,
    عشرين: 20,
    ثلاثون: 30,
    ثلاثين: 30,
    أربعون: 40,
    أربعين: 40,
    خمسون: 50,
    خمسين: 50,
    ستون: 60,
    ستين: 60,
    سبعون: 70,
    سبعين: 70,
    ثمانون: 80,
    ثمانين: 80,
    تسعون: 90,
    تسعين: 90,
  },
  hundredWords: ['مئة', 'مائة'],
  thousandWords: ['ألف', 'الف'],
  conjunctions: ['و'],
  decimalConnectors: ['فاصلة'],
  // "و" ("and") is normally written fused to the next word ("وأربعون"), not as its own token.
  attachedPrefixes: ['و'],
};
