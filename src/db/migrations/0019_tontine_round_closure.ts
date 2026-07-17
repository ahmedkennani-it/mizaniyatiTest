import type { Migration } from '../types';

/**
 * Adds an explicit closure timestamp to `tontine_rounds` (US-039): once every member of a round
 * has paid, the organizer can close it. Closure is a manual bookkeeping action recorded here —
 * it does not change which round is "current" (`findCurrentRound` stays month-based, per
 * `src/tontine/tontineStatus.ts`), it only lets the app remember that a round was settled instead
 * of merely elapsed.
 */
export const tontineRoundClosureMigration: Migration = {
  version: 19,
  name: 'tontine_round_closure',
  up: `
ALTER TABLE tontine_rounds ADD COLUMN closed_at TEXT;
`,
};
