import type { Migration } from '../types';
import { coreEntitiesMigration } from './0001_core_entities';
import { categoryDefaultsMigration } from './0002_category_defaults';
import { transactionTypeMigration } from './0003_transaction_type';
import { categoryBudgetsMigration } from './0004_category_budgets';
import { notificationsMigration } from './0005_notifications';
import { categoryBudgetRolloverMigration } from './0006_category_budget_rollover';
import { recurringRulesMigration } from './0007_recurring_rules';
import { vaultsMigration } from './0008_vaults';
import { tontineMigration } from './0009_tontine';
import { zakatMigration } from './0010_zakat';
import { seasonalThemesMigration } from './0011_seasonal_themes';
import { memberRolesMigration } from './0012_member_roles';
import { subscriptionsMigration } from './0013_subscriptions';
import { userSettingsMigration } from './0014_user_settings';
import { householdDebtTransferMigration } from './0015_household_debt_transfer';

/**
 * Ordered registry of schema migrations. Add new entries with a strictly increasing
 * `version`; never edit or remove a migration once it has shipped — add a new one instead,
 * since `_migrations` / `PRAGMA user_version` on real devices already reflect past versions.
 */
export const migrations: Migration[] = [
  coreEntitiesMigration,
  categoryDefaultsMigration,
  transactionTypeMigration,
  categoryBudgetsMigration,
  notificationsMigration,
  categoryBudgetRolloverMigration,
  recurringRulesMigration,
  vaultsMigration,
  tontineMigration,
  zakatMigration,
  seasonalThemesMigration,
  memberRolesMigration,
  subscriptionsMigration,
  userSettingsMigration,
  householdDebtTransferMigration,
];
