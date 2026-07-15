import { getAppliedMigrations, getDatabaseVersion, migrateDatabase } from '../migrate';
import { createFakeDatabase } from '../testUtils/createFakeDatabase';
import type { Migration } from '../types';

describe('migrateDatabase', () => {
  it('starts at version 0 on a fresh database', async () => {
    const { db } = createFakeDatabase();
    expect(await getDatabaseVersion(db)).toBe(0);
  });

  it('applies pending migrations in ascending order and updates the version', async () => {
    const { db, getUserVersion } = createFakeDatabase();
    // Deliberately out of order, to prove migrateDatabase sorts before applying.
    const migrations: Migration[] = [
      { version: 2, name: 'second', up: 'CREATE TABLE b (id INTEGER);' },
      { version: 1, name: 'first', up: 'CREATE TABLE a (id INTEGER);' },
    ];

    const finalVersion = await migrateDatabase(db, migrations);

    expect(finalVersion).toBe(2);
    expect(getUserVersion()).toBe(2);

    const history = await getAppliedMigrations(db);
    expect(history.map((h) => h.version)).toEqual([1, 2]);
    expect(history.map((h) => h.name)).toEqual(['first', 'second']);
  });

  it('is idempotent: running twice does not reapply already-applied migrations', async () => {
    const { db } = createFakeDatabase();
    const migrations: Migration[] = [
      { version: 1, name: 'first', up: 'CREATE TABLE a (id INTEGER);' },
    ];

    await migrateDatabase(db, migrations);
    const secondRunVersion = await migrateDatabase(db, migrations);

    expect(secondRunVersion).toBe(1);
    const history = await getAppliedMigrations(db);
    expect(history).toHaveLength(1);
  });

  it('only applies migrations newer than the current version', async () => {
    const { db } = createFakeDatabase();
    await migrateDatabase(db, [{ version: 1, name: 'first', up: 'CREATE TABLE a (id INTEGER);' }]);

    const finalVersion = await migrateDatabase(db, [
      { version: 1, name: 'first', up: 'CREATE TABLE a (id INTEGER);' },
      { version: 2, name: 'second', up: 'CREATE TABLE b (id INTEGER);' },
    ]);

    expect(finalVersion).toBe(2);
    const history = await getAppliedMigrations(db);
    expect(history.map((h) => h.version)).toEqual([1, 2]);
  });

  it('rolls back a failing migration and leaves the version/history untouched for it', async () => {
    const { db, getUserVersion } = createFakeDatabase();
    const originalExec = db.execAsync.bind(db);
    const failingUp = 'THIS WILL FAIL';
    db.execAsync = async (source: string) => {
      if (source.trim() === failingUp) {
        throw new Error('boom');
      }
      return originalExec(source);
    };

    await expect(
      migrateDatabase(db, [
        { version: 1, name: 'first', up: 'CREATE TABLE a (id INTEGER);' },
        { version: 2, name: 'second-fails', up: failingUp },
      ]),
    ).rejects.toThrow('boom');

    expect(getUserVersion()).toBe(1);
    const history = await getAppliedMigrations(db);
    expect(history.map((h) => h.version)).toEqual([1]);
  });

  it('rejects duplicate migration versions', async () => {
    const { db } = createFakeDatabase();
    await expect(
      migrateDatabase(db, [
        { version: 1, name: 'a', up: 'CREATE TABLE a (id INTEGER);' },
        { version: 1, name: 'b', up: 'CREATE TABLE b (id INTEGER);' },
      ]),
    ).rejects.toThrow('Duplicate migration version');
  });

  it('is a cheap no-op with an empty migrations list', async () => {
    const { db } = createFakeDatabase();
    expect(await migrateDatabase(db, [])).toBe(0);
    expect(await getAppliedMigrations(db)).toEqual([]);
  });
});
