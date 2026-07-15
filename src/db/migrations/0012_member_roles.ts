import type { Migration } from '../types';

/**
 * Adds `members.role` (US-027, `docs/specs/profil-reglages.md`) — `'editor'` by default so every
 * existing/new local member keeps full access. The role has no real enforcement yet: that needs
 * the shared cloud account from US-039/US-040 (`seedDefaultMember.ts`'s own comment already
 * deferred "family sharing/invitations" there). Storing it now just means the data model doesn't
 * need another migration once that story lands.
 */
export const memberRolesMigration: Migration = {
  version: 12,
  name: 'member_roles',
  up: `
ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'editor';
`,
};
