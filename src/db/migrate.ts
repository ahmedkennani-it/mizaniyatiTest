import type { Migration, SqlDatabase } from './types';

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS _migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export interface AppliedMigration {
  version: number;
  name: string;
  appliedAt: string;
}

export async function getDatabaseVersion(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

export async function getAppliedMigrations(db: SqlDatabase): Promise<AppliedMigration[]> {
  const rows = await db.getAllAsync<{ version: number; name: string; applied_at: string }>(
    'SELECT version, name, applied_at FROM _migrations ORDER BY version ASC;',
  );
  return rows.map((row) => ({ version: row.version, name: row.name, appliedAt: row.applied_at }));
}

/**
 * Applies every migration whose `version` is greater than the database's current
 * `PRAGMA user_version`, in ascending order, each wrapped in its own transaction. A failing
 * migration rolls back cleanly (leaving `user_version` and `_migrations` untouched for that
 * migration) and stops the run; migrations already committed before it stay applied.
 *
 * Safe to call on every app start: with nothing pending it's a cheap no-op after the bootstrap
 * table check.
 */
export async function migrateDatabase(db: SqlDatabase, migrations: Migration[]): Promise<number> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  assertStrictlyIncreasingVersions(sorted);

  // Per-connection setting (not persisted in the db file, and a no-op if set inside a
  // transaction) — must run before the bootstrap table and any migration's BEGIN/COMMIT.
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(BOOTSTRAP_SQL);

  let currentVersion = await getDatabaseVersion(db);

  for (const migration of sorted) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await db.execAsync('BEGIN;');
    try {
      await db.execAsync(migration.up);
      await db.runAsync('INSERT INTO _migrations (version, name) VALUES (?, ?);', [
        migration.version,
        migration.name,
      ]);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      await db.execAsync('COMMIT;');
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }

    currentVersion = migration.version;
  }

  return currentVersion;
}

function assertStrictlyIncreasingVersions(sortedMigrations: Migration[]): void {
  for (let i = 1; i < sortedMigrations.length; i += 1) {
    if (sortedMigrations[i].version === sortedMigrations[i - 1].version) {
      throw new Error(`Duplicate migration version: ${sortedMigrations[i].version}`);
    }
  }
}
