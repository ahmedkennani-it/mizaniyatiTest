import * as SQLite from 'expo-sqlite';

import { migrateDatabase } from './migrate';
import { migrations } from './migrations';
import type { SqlDatabase } from './types';

const DATABASE_NAME = 'mizaniyati.db';

let dbInstance: SqlDatabase | null = null;
let migrationPromise: Promise<number> | null = null;

/** Opens (or returns the already-open) local SQLite database. Offline: no network involved. */
export function getDatabase(): SqlDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return dbInstance;
}

/**
 * Runs pending migrations against the local database. Memoized so concurrent callers during
 * app startup share a single migration run instead of racing each other.
 */
export function ensureMigrated(): Promise<number> {
  if (!migrationPromise) {
    migrationPromise = migrateDatabase(getDatabase(), migrations);
  }
  return migrationPromise;
}

/** Test-only: clears the memoized singleton so each test starts from a clean slate. */
export function __resetDatabaseForTests(): void {
  dbInstance = null;
  migrationPromise = null;
}
