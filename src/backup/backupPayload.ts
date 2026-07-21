import {
  listAllMembers,
  listCategories,
  listHouseholds,
  listTransactions,
  listVaultContributions,
  listVaults,
} from '../db/repositories';
import type {
  Category,
  Household,
  Member,
  Transaction,
  Vault,
  VaultContribution,
} from '../db/repositories';
import type { SqlDatabase } from '../db/types';

/**
 * What a backup file actually contains — deliberately scoped to exactly what US-071b's 3rd
 * criterion names as needing to survive a restore ("foyer, transactions, catégories et
 * objectifs"), plus `members` (not named by the criterion, but a structural requirement: every
 * `Transaction`/`VaultContribution` references a `memberId`, so members are the one addition
 * needed for the four named entities to actually round-trip without dangling foreign keys).
 * Tontine/dettes/zakat/réglages/abonnement are out of scope for this first version — a natural
 * follow-up, not attempted here.
 */
export interface BackupPayloadV1 {
  version: 1;
  exportedAt: string;
  households: Household[];
  members: Member[];
  categories: Category[];
  transactions: Transaction[];
  vaults: Vault[];
  vaultContributions: VaultContribution[];
}

export async function buildBackupPayload(db: SqlDatabase): Promise<BackupPayloadV1> {
  const [households, members, categories, transactions, vaults, vaultContributions] =
    await Promise.all([
      listHouseholds(db),
      listAllMembers(db),
      listCategories(db),
      listTransactions(db),
      listVaults(db),
      listVaultContributions(db),
    ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    households,
    members,
    categories,
    transactions,
    vaults,
    vaultContributions,
  };
}
