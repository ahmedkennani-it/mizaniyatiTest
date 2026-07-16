export type TabName = 'home' | 'categories' | 'tontine' | 'transfers' | 'profile';

/**
 * Markets where the rotating savings group (daret / tontine / ROSCA) is an everyday practice, so
 * the tab earns its place in the bar. Everywhere else — the diaspora markets — the same slot goes
 * to Transferts, which is what those households actually use week to week (US-013).
 *
 * Listed by country rather than derived from language or currency: French is spoken on both sides
 * of this split, and the euro covers markets that have tontines and markets that don't.
 */
const TONTINE_MARKETS = new Set([
  'MA', // Maroc — daret
  'DZ', // Algérie
  'TN', // Tunisie
  'EG', // Égypte — gam'iya
  'SN', // Sénégal
  'CI', // Côte d'Ivoire
  'CM', // Cameroun
  'ML', // Mali
]);

/** Whether a market's households run tontines — false for the diaspora markets (FR, ES, BE…). */
export function marketHasTontine(countryCode: string): boolean {
  return TONTINE_MARKETS.has(countryCode.toUpperCase());
}

/**
 * The tabs the bar shows for a market (US-013).
 *
 * Senior mode keeps only Accueil and Profil. The point isn't to hide features — the central add
 * button and every screen stay reachable from the dashboard — it's that four small targets in a
 * row is the thing senior mode exists to avoid, and the two remaining ones can then be large.
 */
export function resolveTabs(countryCode: string, seniorMode: boolean): TabName[] {
  if (seniorMode) {
    return ['home', 'profile'];
  }
  return ['home', 'categories', marketHasTontine(countryCode) ? 'tontine' : 'transfers', 'profile'];
}
