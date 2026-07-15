/**
 * Minimal subset of `expo-sqlite`'s `SQLiteDatabase` async API that the rest of the app
 * depends on. Keeping it as a narrow interface (instead of importing `SQLiteDatabase`
 * directly everywhere) lets the migration runner and data-access code be exercised with a
 * lightweight in-memory fake in tests, since `expo-sqlite`'s native module isn't available
 * under Jest.
 */
export type SqlBindParams = unknown[] | Record<string, unknown>;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlBindParams): Promise<SqlRunResult>;
  getAllAsync<T>(source: string, params?: SqlBindParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlBindParams): Promise<T | null>;
}

export interface Migration {
  /** Positive, strictly increasing version number. Also stored as SQLite's `PRAGMA user_version`. */
  version: number;
  name: string;
  /** Raw SQL script (one or more statements) applied when this migration runs. */
  up: string;
}
