import {
  createHousehold,
  createMember,
  listHouseholds,
  listMembers,
  updateHousehold,
  updateMember,
} from '../db/repositories';
import type { Household, Member } from '../db/repositories';
import type { SqlDatabase } from '../db/types';

export interface HouseholdSetupInput {
  /** The person onboarding — greeted by name on the dashboard. */
  firstName: string;
  /** The family budget container's name. */
  householdName: string;
  currencyCode: string;
}

export interface HouseholdSetup {
  household: Household;
  /** The creator, always an admin (US-005). */
  self: Member;
}

/**
 * Creates the household and its first member from the onboarding step (US-005). The creator is an
 * **admin**: someone has to be able to rename the household and, later, invite the family, and on
 * a fresh install there is nobody else to grant it.
 *
 * Renames the seeded member rather than adding a second one: `ensureAppReady` already created a
 * placeholder "Moi" at the language & country step so the member picker is never empty, and
 * leaving it behind would give a one-person household two members from its first minute.
 *
 * Idempotent on the household: re-running the step renames the existing one instead of stacking
 * duplicates, so an interrupted onboarding recovers cleanly.
 */
export async function setupHousehold(
  db: SqlDatabase,
  input: HouseholdSetupInput,
): Promise<HouseholdSetup> {
  const existingHouseholds = await listHouseholds(db);
  const household = existingHouseholds[0]
    ? await updateHousehold(db, existingHouseholds[0].id, {
        name: input.householdName,
        currencyCode: input.currencyCode,
      })
    : await createHousehold(db, { name: input.householdName, currencyCode: input.currencyCode });

  const existingMembers = await listMembers(db);
  const self = existingMembers[0]
    ? await updateMember(db, existingMembers[0].id, { name: input.firstName, role: 'admin' })
    : await createMember(db, { name: input.firstName, role: 'admin' });

  return { household, self };
}
