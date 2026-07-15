import { createMember, listMembers } from '../../db/repositories';
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
import { seedDefaultMember } from '../seedDefaultMember';

describe('seedDefaultMember', () => {
  it('creates a default "Moi" member when none exist (fr)', async () => {
    const { db } = createFakeDatabase();

    const member = await seedDefaultMember(db, 'fr');

    expect(member.name).toBe('Moi');
    const all = await listMembers(db);
    expect(all).toHaveLength(1);
  });

  it('creates a default Arabic-named member when none exist (ar)', async () => {
    const { db } = createFakeDatabase();

    const member = await seedDefaultMember(db, 'ar');

    expect(member.name).toBe('أنا');
  });

  it('is idempotent: calling it again does not create a second member', async () => {
    const { db } = createFakeDatabase();

    await seedDefaultMember(db, 'fr');
    await seedDefaultMember(db, 'fr');

    const all = await listMembers(db);
    expect(all).toHaveLength(1);
  });

  it('does nothing if a member already exists (e.g. from a family invite)', async () => {
    const { db } = createFakeDatabase();
    await createMember(db, { name: 'Salma' });

    const returned = await seedDefaultMember(db, 'fr');

    expect(returned.name).toBe('Salma');
    const all = await listMembers(db);
    expect(all).toHaveLength(1);
  });
});
