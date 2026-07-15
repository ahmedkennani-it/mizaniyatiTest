import type { ZakatNisabBasis } from '../db/repositories';

/** Fixed nisab weights per madhhab convention — `docs/specs/zakat.md`'s "or 85 g ou argent 595 g". */
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

/** 2,5 % — the rate every madhhab this app supports agrees on for the standard zakatable base. */
export const ZAKAT_RATE = 0.025;

export interface ZakatAssets {
  cashMinor: number;
  goldSilverMinor: number;
  investmentsMinor: number;
  debtsMinor: number;
}

export interface ZakatResult {
  /** `max(0, avoirs - dettes)` — "Dettes > avoirs → base ≤ 0" never goes negative. */
  baseMinor: number;
  /** `2.5% of baseMinor` when `aboveNisab`, else `0`. */
  dueMinor: number;
  /** `null` when no price has been entered for the selected basis yet. */
  nisabMinor: number | null;
  aboveNisab: boolean;
}

/**
 * The nisab threshold in currency for the selected basis — "Or vs argent : le choix change le
 * seuil du nisab → recalcul." `null` when the corresponding price hasn't been entered
 * (`docs/specs/zakat.md`'s "aucun prix de l'or disponible" case), so callers can distinguish
 * "below nisab" from "can't tell yet" rather than silently treating a missing price as zero.
 */
export function computeNisabMinor(
  basis: ZakatNisabBasis,
  goldPricePerGramMinor: number | null,
  silverPricePerGramMinor: number | null,
): number | null {
  if (basis === 'gold') {
    return goldPricePerGramMinor === null ? null : goldPricePerGramMinor * NISAB_GOLD_GRAMS;
  }
  return silverPricePerGramMinor === null ? null : silverPricePerGramMinor * NISAB_SILVER_GRAMS;
}

/**
 * "Base = avoirs − dettes, et Zakat = 2,5 % de la base" (`docs/specs/zakat.md`). Pure function —
 * `nisabMinor` comes from `computeNisabMinor`, computed separately so a caller can show "prix non
 * disponible" without losing the base/due figures. When `nisabMinor` is `null`, `aboveNisab` is
 * `false` (no due amount is asserted) rather than guessed.
 */
export function computeZakatAssessment(
  assets: ZakatAssets,
  nisabMinor: number | null,
): ZakatResult {
  const totalAssetsMinor = assets.cashMinor + assets.goldSilverMinor + assets.investmentsMinor;
  const baseMinor = Math.max(0, totalAssetsMinor - assets.debtsMinor);
  const aboveNisab = nisabMinor !== null && baseMinor >= nisabMinor;
  const dueMinor = aboveNisab ? Math.round(baseMinor * ZAKAT_RATE) : 0;

  return { baseMinor, dueMinor, nisabMinor, aboveNisab };
}
