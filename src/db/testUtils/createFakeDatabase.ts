import type { SqlBindParams, SqlDatabase } from '../types';

interface MigrationRow {
  version: number;
  name: string;
  applied_at: string;
}

type Row = Record<string, unknown>;

/**
 * Foreign key relationships enforced by the generic table engine below, mirroring the `REFERENCES`
 * clauses in `migrations/0001_core_entities.ts`. Real SQLite enforces these from the schema; since
 * this fake has no schema, they're declared here instead.
 */
const FOREIGN_KEYS: Record<string, { column: string; referencesTable: string }[]> = {
  transactions: [
    { column: 'category_id', referencesTable: 'categories' },
    { column: 'member_id', referencesTable: 'members' },
  ],
  categories: [{ column: 'seasonal_theme_id', referencesTable: 'seasonal_themes' }],
  category_budgets: [{ column: 'category_id', referencesTable: 'categories' }],
  recurring_rules: [
    { column: 'category_id', referencesTable: 'categories' },
    { column: 'member_id', referencesTable: 'members' },
  ],
  vault_contributions: [
    { column: 'vault_id', referencesTable: 'vaults' },
    { column: 'member_id', referencesTable: 'members' },
  ],
  tontine_members: [{ column: 'group_id', referencesTable: 'tontine_groups' }],
  tontine_rounds: [
    { column: 'group_id', referencesTable: 'tontine_groups' },
    { column: 'beneficiary_member_id', referencesTable: 'tontine_members' },
  ],
  tontine_payments: [
    { column: 'round_id', referencesTable: 'tontine_rounds' },
    { column: 'member_id', referencesTable: 'tontine_members' },
  ],
};

function validateRow(tableName: string, row: Row, tables: Map<string, Map<string, Row>>): void {
  // Every `*_minor` column across every migration has a `CHECK (... >= 0)` clause (money is
  // always a non-negative integer minor unit) — checked generically here instead of one entry
  // per table/column, so a new `*_minor` column is covered automatically.
  for (const [column, value] of Object.entries(row)) {
    if (column.endsWith('_minor') && typeof value === 'number' && value < 0) {
      throw new Error(`CHECK constraint failed: ${tableName}.${column}`);
    }
  }
  for (const fk of FOREIGN_KEYS[tableName] ?? []) {
    if (row[fk.column] === null || row[fk.column] === undefined) {
      continue; // nullable FK column (e.g. categories.seasonal_theme_id) — null means "unset".
    }
    const referenced = tables.get(fk.referencesTable);
    if (!referenced?.has(row[fk.column] as string)) {
      throw new Error(
        `FOREIGN KEY constraint failed: ${tableName}.${fk.column} -> ${fk.referencesTable}.id`,
      );
    }
  }
}

function pickColumns(row: Row, columns: string[]): Row {
  const picked: Row = {};
  for (const column of columns) {
    picked[column] = row[column];
  }
  return picked;
}

const INSERT_RE = /^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\);$/;
const SELECT_BY_ID_RE = /^SELECT ([\w, ]+) FROM (\w+) WHERE id = \?;$/;
const SELECT_ORDERED_RE = /^SELECT ([\w, ]+) FROM (\w+) ORDER BY (.+);$/;
const ORDER_TERM_RE = /^(\w+) (ASC|DESC)$/;
const UPDATE_RE = /^UPDATE (\w+) SET (.+) WHERE id = \?;$/;
const DELETE_RE = /^DELETE FROM (\w+) WHERE id = \?;$/;

/**
 * Hand-rolled in-memory stand-in for `expo-sqlite`'s `SQLiteDatabase`, used to unit-test both the
 * migration runner (`migrate.ts`) and the domain repositories (`repositories/*Repository.ts`)
 * without a real SQLite engine (unavailable under Jest in this sandbox — see
 * `apps/mobile/CLAUDE.md`). It understands the exact bookkeeping statements `migrate.ts` issues
 * (`PRAGMA user_version`, `BEGIN`/`COMMIT`/`ROLLBACK`, the `_migrations` table), plus a small
 * generic engine for the fixed INSERT/SELECT/UPDATE/DELETE shapes the repositories emit (single
 * table, `WHERE id = ?` or `ORDER BY <col>`), including the PRIMARY KEY / FOREIGN KEY / CHECK
 * constraints declared in `migrations/0001_core_entities.ts`. A migration's own `up` SQL (the
 * `CREATE TABLE`/`CREATE INDEX` blob) is still a no-op — tables are created lazily on first access
 * by the generic engine, so no DDL execution is needed for it to work.
 */
export function createFakeDatabase() {
  let userVersion = 0;
  let migrationsTable: MigrationRow[] = [];
  let snapshot: { userVersion: number; migrationsTable: MigrationRow[] } | null = null;
  const statements: string[] = [];
  const tables = new Map<string, Map<string, Row>>();

  function table(name: string): Map<string, Row> {
    let existing = tables.get(name);
    if (!existing) {
      existing = new Map();
      tables.set(name, existing);
    }
    return existing;
  }

  const db: SqlDatabase = {
    async execAsync(source: string) {
      const statement = source.trim();
      statements.push(statement);

      if (statement === 'BEGIN;') {
        snapshot = { userVersion, migrationsTable: [...migrationsTable] };
        return;
      }
      if (statement === 'COMMIT;') {
        snapshot = null;
        return;
      }
      if (statement === 'ROLLBACK;') {
        if (snapshot) {
          userVersion = snapshot.userVersion;
          migrationsTable = snapshot.migrationsTable;
          snapshot = null;
        }
        return;
      }

      const pragmaSet = statement.match(/^PRAGMA user_version = (\d+);$/);
      if (pragmaSet) {
        userVersion = Number(pragmaSet[1]);
        return;
      }
      // Any other statement (PRAGMA foreign_keys, bootstrap DDL, or a migration's own `up` SQL /
      // CREATE TABLE|INDEX blob) is a no-op here — domain tables are created lazily by `table()`.
    },

    async runAsync(source: string, params?: SqlBindParams) {
      const statement = source.trim();
      statements.push(statement);
      const args = Array.isArray(params) ? params : [];

      if (statement === 'INSERT INTO _migrations (version, name) VALUES (?, ?);' && Array.isArray(params)) {
        migrationsTable.push({
          version: params[0] as number,
          name: params[1] as string,
          applied_at: new Date().toISOString(),
        });
        return { changes: 1, lastInsertRowId: migrationsTable.length };
      }

      const insertMatch = statement.match(INSERT_RE);
      if (insertMatch) {
        const [, tableName, columnsRaw] = insertMatch;
        const columns = columnsRaw.split(',').map((c) => c.trim());
        const row: Row = {};
        columns.forEach((column, index) => {
          row[column] = args[index];
        });
        const store = table(tableName);
        if (store.has(row.id as string)) {
          throw new Error(`UNIQUE constraint failed: ${tableName}.id`);
        }
        validateRow(tableName, row, tables);
        store.set(row.id as string, row);
        return { changes: 1, lastInsertRowId: store.size };
      }

      const updateMatch = statement.match(UPDATE_RE);
      if (updateMatch) {
        const [, tableName, setClauseRaw] = updateMatch;
        const assignments = setClauseRaw.split(',').map((clause) => clause.trim());
        const columns = assignments.map((clause) => clause.replace(/\s*=\s*\?$/, ''));
        const id = args[args.length - 1] as string;
        const store = table(tableName);
        const existing = store.get(id);
        if (!existing) {
          return { changes: 0, lastInsertRowId: 0 };
        }
        const updated: Row = { ...existing };
        columns.forEach((column, index) => {
          updated[column] = args[index];
        });
        validateRow(tableName, updated, tables);
        store.set(id, updated);
        return { changes: 1, lastInsertRowId: 0 };
      }

      const deleteMatch = statement.match(DELETE_RE);
      if (deleteMatch) {
        const [, tableName] = deleteMatch;
        const id = args[0] as string;
        const store = table(tableName);
        if (!store.has(id)) {
          return { changes: 0, lastInsertRowId: 0 };
        }
        store.delete(id);
        return { changes: 1, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    },

    async getAllAsync<T>(source: string, params?: SqlBindParams) {
      const statement = source.trim();
      if (statement.startsWith('SELECT version, name, applied_at FROM _migrations')) {
        return [...migrationsTable].sort((a, b) => a.version - b.version) as unknown as T[];
      }

      const orderedMatch = statement.match(SELECT_ORDERED_RE);
      if (orderedMatch) {
        const [, columnsRaw, tableName, orderByRaw] = orderedMatch;
        const columns = columnsRaw.split(',').map((c) => c.trim());
        const orderTerms = orderByRaw.split(',').map((term) => {
          const match = term.trim().match(ORDER_TERM_RE);
          if (!match) throw new Error(`Unsupported ORDER BY term: ${term}`);
          const [, column, direction] = match;
          return { column, direction };
        });
        const rows = [...table(tableName).values()].sort((a, b) => {
          for (const { column, direction } of orderTerms) {
            const left = a[column];
            const right = b[column];
            if (left === right) continue;
            const comparison = (left as string | number) < (right as string | number) ? -1 : 1;
            return direction === 'ASC' ? comparison : -comparison;
          }
          return 0;
        });
        return rows.map((row) => pickColumns(row, columns)) as unknown as T[];
      }

      void params;
      return [] as T[];
    },

    async getFirstAsync<T>(source: string, params?: SqlBindParams) {
      const statement = source.trim();
      if (statement === 'PRAGMA user_version;') {
        return { user_version: userVersion } as unknown as T;
      }

      const byIdMatch = statement.match(SELECT_BY_ID_RE);
      if (byIdMatch) {
        const [, columnsRaw, tableName] = byIdMatch;
        const columns = columnsRaw.split(',').map((c) => c.trim());
        const args = Array.isArray(params) ? params : [];
        const row = table(tableName).get(args[0] as string);
        return row ? (pickColumns(row, columns) as unknown as T) : null;
      }

      return null;
    },
  };

  return {
    db,
    statements,
    getUserVersion: () => userVersion,
    getMigrationsTable: () => [...migrationsTable],
  };
}
