import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { createMember, listHouseholds, listMembers } from '../../db/repositories';
import { canEdit, isAdmin } from '../memberRights';
import { setupHousehold } from '../setupHousehold';

const INPUT = { firstName: 'Youssef', householdName: 'Famille Benali', currencyCode: 'MAD' };

describe('setupHousehold (US-005)', () => {
  it('creates the household with its name and currency', async () => {
    const { db } = createFakeDatabase();

    const { household } = await setupHousehold(db, INPUT);

    expect(household).toMatchObject({ name: 'Famille Benali', currencyCode: 'MAD' });
    expect(await listHouseholds(db)).toHaveLength(1);
  });

  it('makes the creator an admin', async () => {
    const { db } = createFakeDatabase();

    const { self } = await setupHousehold(db, INPUT);

    expect(self).toMatchObject({ name: 'Youssef', role: 'admin' });
  });

  it('gives the creator edit rights', async () => {
    const { db } = createFakeDatabase();

    const { self } = await setupHousehold(db, INPUT);

    expect(isAdmin(self.role)).toBe(true);
    expect(canEdit(self.role)).toBe(true);
  });

  /**
   * `ensureAppReady` seeds a placeholder "Moi" at the language & country step so the member picker
   * is never empty. Leaving it behind would give a one-person household two members from minute one.
   */
  it('renames the seeded placeholder member instead of adding a second one', async () => {
    const { db } = createFakeDatabase();
    await createMember(db, { name: 'Moi' });

    const { self } = await setupHousehold(db, INPUT);

    const members = await listMembers(db);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ id: self.id, name: 'Youssef', role: 'admin' });
  });

  it('promotes the seeded member to admin, not just renames it', async () => {
    const { db } = createFakeDatabase();
    await createMember(db, { name: 'Moi' });

    await setupHousehold(db, INPUT);

    expect((await listMembers(db))[0].role).toBe('admin');
  });

  // An interrupted onboarding re-runs the step; it must recover, not stack duplicates.
  it('renames the existing household rather than creating a second', async () => {
    const { db } = createFakeDatabase();
    const first = await setupHousehold(db, INPUT);

    const second = await setupHousehold(db, { ...INPUT, householdName: 'Famille Alami' });

    expect(await listHouseholds(db)).toHaveLength(1);
    expect(second.household.id).toBe(first.household.id);
    expect(second.household.name).toBe('Famille Alami');
  });

  it('keeps the household to one member across a re-run', async () => {
    const { db } = createFakeDatabase();
    await setupHousehold(db, INPUT);

    await setupHousehold(db, { ...INPUT, firstName: 'Salma' });

    const members = await listMembers(db);
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe('Salma');
  });

  it('takes the household currency from the chosen market', async () => {
    const { db } = createFakeDatabase();

    const { household } = await setupHousehold(db, { ...INPUT, currencyCode: 'EUR' });

    expect(household.currencyCode).toBe('EUR');
  });
});

describe('memberRights', () => {
  it.each([
    ['admin', true, true],
    ['editor', true, false],
    ['viewer', false, false],
  ] as const)('%s: canEdit=%s isAdmin=%s', (role, edits, admins) => {
    expect(canEdit(role)).toBe(edits);
    expect(isAdmin(role)).toBe(admins);
  });
});
