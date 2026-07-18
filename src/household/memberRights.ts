import type { Member, MemberRole } from '../db/repositories';

/**
 * Whether a role may change the household's data (US-005). Not enforced against "who is currently
 * using the app" yet — that needs a session/identity concept that doesn't exist on this
 * single-device MVP — but the rule lives here so the two roles that carry edit rights are named in
 * one place rather than re-derived per screen. `computeMemberAccess` below layers the Free-plan
 * seat limit (US-054) on top of this, which *is* fully enforceable locally.
 */
export function canEdit(role: MemberRole): boolean {
  return role === 'admin' || role === 'editor';
}

/** Whether a role may manage the household itself: invite, remove, rename. */
export function isAdmin(role: MemberRole): boolean {
  return role === 'admin';
}

export interface MemberAccess {
  /** `role` allows editing AND the member is within the plan's active-member limit. */
  canEdit: boolean;
  /**
   * `true` when the role itself allows editing but the member has fallen outside the plan's seat
   * limit (US-054's Pro → Free downgrade) — locked, not deleted: no data is ever lost, the member
   * (and their past transactions) stays fully visible.
   */
  isReadOnlyDueToPlanLimit: boolean;
}

/**
 * A member's actual edit access = their stored `role` **and** whether they fall within the plan's
 * `members.max` seat limit. `members` should be every *active* member of the household (already
 * filtered — `listMembers`, never `listAllMembers`); seats go to the earliest-created members
 * first, so a household that downgrades from Pro never locks out the person who set it up.
 */
export function computeMemberAccess(
  members: Member[],
  memberId: string,
  memberLimit: number,
): MemberAccess {
  const bySeniority = [...members].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const index = bySeniority.findIndex((member) => member.id === memberId);
  if (index === -1) {
    return { canEdit: false, isReadOnlyDueToPlanLimit: false };
  }
  const roleAllowsEdit = canEdit(bySeniority[index].role);
  const withinLimit = index < memberLimit;
  return {
    canEdit: roleAllowsEdit && withinLimit,
    isReadOnlyDueToPlanLimit: roleAllowsEdit && !withinLimit,
  };
}
