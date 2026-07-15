import { createFakeDatabase } from '../testUtils/createFakeDatabase';

const { db: mockFakeDb } = createFakeDatabase();
const mockOpenDatabaseSync = jest.fn((_databaseName: string) => mockFakeDb);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (databaseName: string) => mockOpenDatabaseSync(databaseName),
}));

// eslint-disable-next-line import/first -- must come after jest.mock('expo-sqlite', ...) above
import { ensureMigrated, getDatabase, __resetDatabaseForTests } from '../client';

describe('db client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDatabaseForTests();
  });

  it('opens the database once and reuses it across calls (offline, no network involved)', () => {
    const first = getDatabase();
    const second = getDatabase();

    expect(first).toBe(second);
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('mizaniyati.db');
  });

  it('memoizes the migration run so concurrent callers share one migration pass', async () => {
    const [a, b] = await Promise.all([ensureMigrated(), ensureMigrated()]);

    expect(a).toBe(b);
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
  });
});
