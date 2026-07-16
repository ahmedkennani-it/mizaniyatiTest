import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import { createCategory } from '../repositories/categoryRepository';
import { createMember } from '../repositories/memberRepository';
import {
  createTransaction,
  listTransactions,
  updateTransaction,
} from '../repositories/transactionRepository';
import { createFakeDatabase } from '../testUtils/createFakeDatabase';
import { computeMonthlyBalance } from '../../transactions';

/**
 * Makes every network entry point throw, so anything reaching for the network during the block
 * fails loudly instead of silently succeeding against the test runner's real one.
 */
async function withNoNetwork<T>(run: () => Promise<T>): Promise<T> {
  const globals = globalThis as Record<string, unknown>;
  const saved = {
    fetch: globals.fetch,
    XMLHttpRequest: globals.XMLHttpRequest,
    WebSocket: globals.WebSocket,
  };
  const offline = () => {
    throw new Error('Network request attempted while offline');
  };
  globals.fetch = offline;
  globals.XMLHttpRequest = offline;
  globals.WebSocket = offline;
  try {
    return await run();
  } finally {
    Object.assign(globals, saved);
  }
}

/** US-070: "une opération saisie est persistée localement et consultable hors ligne", and
 * "sans réseau, toutes les fonctions de saisie et de consultation restent disponibles". */
describe('local storage works with no network at all', () => {
  it('saves a transaction and reads it back offline', async () => {
    await withNoNetwork(async () => {
      const { db } = createFakeDatabase();
      const category = await createCategory(db, { name: 'Alimentation', icon: 'cart', color: '#0F0' });
      const member = await createMember(db, { name: 'Salma' });

      const saved = await createTransaction(db, {
        type: 'expense',
        amountMinor: 12000,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-07-05T10:00:00.000Z',
        note: 'Courses',
      });

      expect(await listTransactions(db)).toEqual([saved]);
    });
  });

  it('keeps entry, edit and aggregate reads available offline', async () => {
    await withNoNetwork(async () => {
      const { db } = createFakeDatabase();
      const category = await createCategory(db, { name: 'Transport', icon: 'car', color: '#00F' });
      const member = await createMember(db, { name: 'Youssef' });

      await createTransaction(db, {
        type: 'income',
        amountMinor: 500000,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-07-01T10:00:00.000Z',
      });
      const expense = await createTransaction(db, {
        type: 'expense',
        amountMinor: 20000,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-07-05T10:00:00.000Z',
      });

      await updateTransaction(db, expense.id, { amountMinor: 30000 });

      expect(computeMonthlyBalance(await listTransactions(db), '2026-07')).toBe(470000);
    });
  });
});

const SOURCE_ROOT = join(__dirname, '..', '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === '__tests__' || entry === 'testUtils' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

/**
 * The offline guarantee is only as good as the absence of network calls in the first place: a
 * single `fetch` added later would break it long before anyone notices at runtime. This is also
 * the mechanical half of the "no bank connection, no scraping, no aggregator API" guardrail —
 * manual entry is the only way data gets in.
 */
describe('no source file reaches for the network', () => {
  const NETWORK_APIS = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon)\s*\(/;

  it.each(sourceFiles(SOURCE_ROOT).map((path) => [path.slice(SOURCE_ROOT.length + 1), path]))(
    '%s',
    (_relative, path) => {
      expect(readFileSync(path, 'utf8')).not.toMatch(NETWORK_APIS);
    },
  );
});
