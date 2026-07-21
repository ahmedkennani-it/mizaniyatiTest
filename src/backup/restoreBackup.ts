import {
  createCategory,
  createHousehold,
  createMember,
  createTransaction,
  createVault,
  createVaultContribution,
  deleteCategory,
  deleteHousehold,
  deleteMember,
  deleteTransaction,
  deleteVault,
  deleteVaultContribution,
  listAllMembers,
  listCategories,
  listHouseholds,
  listTransactions,
  listVaultContributions,
  listVaults,
  removeMember,
} from '../db/repositories';
import type { SqlDatabase } from '../db/types';
import { InvalidBackupFileError, WrongRecoveryKeyError } from './backupErrors';
import { decryptWithKey, deriveBackupKey } from './backupCrypto';
import type { BackupPayloadV1 } from './backupPayload';

export { InvalidBackupFileError, WrongRecoveryKeyError } from './backupErrors';

/**
 * US-071b's 3rd criterion is scoped to "un appareil vierge" — but onboarding always seeds a
 * starter household (US-005) before any screen that could offer a restore is even reachable, so a
 * literal empty database is never actually the state a household restores into. Restoring instead
 * *replaces* whatever this backup module manages (see `buildBackupPayload`'s scope) with the
 * backup's contents — the same "starting fresh" outcome a device that just finished onboarding
 * already represents from the household's point of view, since nothing real has been entered yet.
 * Tontine/dettes/zakat/réglages/abonnement are untouched, in and out — this only wipes what it also
 * restores.
 */
async function wipeManagedData(db: SqlDatabase): Promise<void> {
  const [transactions, vaultContributions] = await Promise.all([
    listTransactions(db),
    listVaultContributions(db),
  ]);
  for (const transaction of transactions) {
    await deleteTransaction(db, transaction.id);
  }
  for (const contribution of vaultContributions) {
    await deleteVaultContribution(db, contribution.id);
  }

  const [categories, members, vaults, households] = await Promise.all([
    listCategories(db),
    listAllMembers(db),
    listVaults(db),
    listHouseholds(db),
  ]);
  for (const category of categories) {
    await deleteCategory(db, category.id);
  }
  for (const member of members) {
    await deleteMember(db, member.id);
  }
  for (const vault of vaults) {
    await deleteVault(db, vault.id);
  }
  for (const household of households) {
    await deleteHousehold(db, household.id);
  }
}

export interface RestoreCounts {
  households: number;
  members: number;
  categories: number;
  transactions: number;
  vaults: number;
  vaultContributions: number;
}

interface BackupFile {
  version: number;
  salt: string;
  ciphertext: string;
}

function parseBackupFile(fileContent: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    throw new InvalidBackupFileError();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as BackupFile).version !== 1 ||
    typeof (parsed as BackupFile).salt !== 'string' ||
    typeof (parsed as BackupFile).ciphertext !== 'string'
  ) {
    throw new InvalidBackupFileError();
  }
  return parsed as BackupFile;
}

/**
 * US-071b: decrypts a backup file with the household's recovery passphrase, wipes whatever this
 * module manages (`wipeManagedData`), and reconstitutes the household, members, categories,
 * transactions, vaults and their contributions from it — the exact scope US-071b's 3rd criterion
 * names (see `buildBackupPayload`'s doc comment for why `members` is also included). Every
 * `create*` call mints a *new* local id, so a map from the backup's old ids to the freshly created
 * ones re-threads every foreign key (`categoryId`, `memberId`, `vaultId`) as it goes — the
 * repositories have no "insert with this exact id" escape hatch, and none is needed: nothing
 * outside this payload ever referenced the old ids in the first place.
 */
export async function restoreBackup(
  db: SqlDatabase,
  fileContent: string,
  recoveryKey: string,
): Promise<RestoreCounts> {
  const file = parseBackupFile(fileContent);

  const key = deriveBackupKey(recoveryKey, file.salt);
  let payload: BackupPayloadV1;
  try {
    payload = JSON.parse(decryptWithKey(file.ciphertext, key)) as BackupPayloadV1;
  } catch {
    // Decryption/JSON-parse failure at this point almost always means the recovery key is wrong —
    // a malformed *file* was already caught above, before any decryption was attempted.
    throw new WrongRecoveryKeyError();
  }

  // Only reached once decryption proves the key was right — a wrong key must never destroy
  // whatever data was already on the device.
  await wipeManagedData(db);

  for (const household of payload.households) {
    await createHousehold(db, { name: household.name, currencyCode: household.currencyCode });
  }

  const memberIdMap = new Map<string, string>();
  for (const member of payload.members) {
    const created = await createMember(db, { name: member.name, role: member.role });
    memberIdMap.set(member.id, created.id);
    if (member.removedAt) {
      await removeMember(db, created.id, member.removedAt);
    }
  }

  const categoryIdMap = new Map<string, string>();
  for (const category of payload.categories) {
    const created = await createCategory(db, {
      name: category.name,
      icon: category.icon,
      color: category.color,
      isDefault: category.isDefault,
      orderIndex: category.orderIndex,
    });
    categoryIdMap.set(category.id, created.id);
  }

  for (const transaction of payload.transactions) {
    const categoryId = categoryIdMap.get(transaction.categoryId);
    const memberId = memberIdMap.get(transaction.memberId);
    if (!categoryId || !memberId) {
      continue;
    }
    await createTransaction(db, {
      type: transaction.type,
      amountMinor: transaction.amountMinor,
      currencyCode: transaction.currencyCode,
      categoryId,
      memberId,
      occurredAt: transaction.occurredAt,
      note: transaction.note ?? undefined,
    });
  }

  const vaultIdMap = new Map<string, string>();
  for (const vault of payload.vaults) {
    const created = await createVault(db, {
      name: vault.name,
      targetMinor: vault.targetMinor,
      currencyCode: vault.currencyCode,
      deadline: vault.deadline,
    });
    vaultIdMap.set(vault.id, created.id);
  }

  for (const contribution of payload.vaultContributions) {
    const vaultId = vaultIdMap.get(contribution.vaultId);
    const memberId = memberIdMap.get(contribution.memberId);
    if (!vaultId || !memberId) {
      continue;
    }
    await createVaultContribution(db, {
      vaultId,
      amountMinor: contribution.amountMinor,
      memberId,
      date: contribution.date,
      note: contribution.note ?? undefined,
    });
  }

  return {
    households: payload.households.length,
    members: payload.members.length,
    categories: payload.categories.length,
    transactions: payload.transactions.length,
    vaults: payload.vaults.length,
    vaultContributions: payload.vaultContributions.length,
  };
}
