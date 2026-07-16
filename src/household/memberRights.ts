import type { MemberRole } from '../db/repositories';

/**
 * Whether a role may change the household's data (US-005). Not enforced anywhere yet — roles only
 * gain teeth with the shared cloud account (US-039/US-040) — but the rule lives here so the two
 * roles that carry edit rights are named in one place rather than re-derived per screen.
 */
export function canEdit(role: MemberRole): boolean {
  return role === 'admin' || role === 'editor';
}

/** Whether a role may manage the household itself: invite, remove, rename. */
export function isAdmin(role: MemberRole): boolean {
  return role === 'admin';
}
