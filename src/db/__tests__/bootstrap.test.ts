import { createFakeDatabase } from '../testUtils/createFakeDatabase';

const mockOpenDatabaseSync = jest.fn((_databaseName: string) => createFakeDatabase().db);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (databaseName: string) => mockOpenDatabaseSync(databaseName),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { listCategories, listMembers } from '../repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { __resetDatabaseForTests, getDatabase } from '../client';
// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ensureAppReady } from '../bootstrap';

describe('ensureAppReady', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDatabaseForTests();
  });

  it('migrates then seeds default categories and a default member', async () => {
    await ensureAppReady('fr');

    const db = getDatabase();
    const categories = await listCategories(db);
    const members = await listMembers(db);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((category) => category.isDefault)).toBe(true);
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe('Moi');
  });

  it('is safe to call more than once (idempotent seeds)', async () => {
    await ensureAppReady('fr');
    await ensureAppReady('fr');

    const db = getDatabase();
    const categories = await listCategories(db);
    const members = await listMembers(db);
    expect(members).toHaveLength(1);
    expect(categories.filter((category) => category.isDefault)).toHaveLength(categories.length);
  });
});
