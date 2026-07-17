import type { NumberWordLexicon } from './types';

/**
 * French number words 0..999,999. Hyphens are normalized to spaces before tokenizing, so most
 * compounds ("dix-sept", "soixante-dix", "vingt-et-un") fall out of plain addition once split into
 * their parts — 17 = dix(10) + sept(7), 70 = soixante(60) + dix(10). The one genuine exception is
 * "quatre-vingt(s)" (80 = 4×20, not 4+20), which needs an explicit multiplicative compound; 90
 * ("quatre-vingt-dix") then falls back out of addition again once "quatre vingt" merges to 80.
 */
export const FR_NUMBER_WORDS: NumberWordLexicon = {
  compounds: [
    { tokens: ['quatre', 'vingt'], value: 80 },
    { tokens: ['quatre', 'vingts'], value: 80 },
  ],
  words: {
    zéro: 0,
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10,
    onze: 11,
    douze: 12,
    treize: 13,
    quatorze: 14,
    quinze: 15,
    seize: 16,
    vingt: 20,
    trente: 30,
    quarante: 40,
    cinquante: 50,
    soixante: 60,
  },
  hundredWords: ['cent', 'cents'],
  thousandWords: ['mille'],
  conjunctions: ['et'],
  decimalConnectors: ['virgule'],
};
