import type { Migration } from '../types';

/**
 * `members.removed_at` (US-052): "retirer un membre du foyer" is a soft delete, not a `DELETE FROM
 * members` — a removed member's past transactions must stay attributed to them in the household's
 * history (`Transaction.memberId` is never reassigned or nulled out). Nullable, `NULL` meaning
 * "still an active member", same single-source-of-truth pattern as `zakat_assessments.paid_at` and
 * `debts` (`computeDebtStatus`) — never a second status flag that could disagree with it.
 * `memberRepository.listMembers` filters this out for pickers (new transaction/contribution/etc.);
 * `listAllMembers` keeps everyone, for resolving a past transaction's member name.
 */
export const memberRemovalMigration: Migration = {
  version: 26,
  name: 'member_removal',
  up: `
ALTER TABLE members ADD COLUMN removed_at TEXT;
`,
};
