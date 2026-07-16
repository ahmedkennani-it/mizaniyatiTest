import { marketHasModule } from './markets';

export type TabName = 'home' | 'categories' | 'tontine' | 'transfers' | 'profile';

/** Whether a market's households run tontines — false for the diaspora markets (FR, ES, BE…). */
export function marketHasTontine(countryCode: string): boolean {
  return marketHasModule(countryCode, 'tontine');
}

/**
 * The tabs the bar shows for a market (US-013).
 *
 * The bar has exactly one slot for a local module, so a market running **both** (the Gulf) puts
 * Tontine there: it is the weekly ritual, where a transfer is monthly at most. Both modules stay
 * enabled — `marketModules` is the source of truth for that — and Transferts is reached from its
 * own screens rather than the bar. Squeezing a fifth tab in would shrink every target, which is
 * the opposite of what US-013's own touch-target rule asks for.
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
