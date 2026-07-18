import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  categoryAccent,
  categoryIconName,
  computeCategoryBudgetStatus,
  resolveCategoryDisplayName,
} from '../categories';
import { AppScreen, Button, Card, ProgressRing, ScreenHeader, StatCard, Txt, TransactionRow } from '../components';
import type { Category, CategoryBudget, Member, Transaction } from '../db/repositories';
import { useLanguage } from '../i18n';
import { formatMoney } from '../money';
import { useTheme } from '../theme';

export interface CategoryDetailProps {
  category: Category;
  budget?: CategoryBudget;
  /** All transactions — filtered to this category and `monthKey` internally, same convention as
   *  `CategoriesScreen`/`computeCategoryBudgetStatus`. */
  transactions: Transaction[];
  members: Member[];
  monthKey: string;
  currencyCode: string;
  onEdit: () => void;
  onBack: () => void;
}

/**
 * A category's month at a glance (US-027): the big ring for "how much of the cap is gone", three
 * tiles for the numbers behind it, and the month's transactions so an over-cap category is
 * explained by what's actually in it, not just asserted.
 */
export function CategoryDetail({
  category,
  budget,
  transactions,
  members,
  monthKey,
  currencyCode,
  onEdit,
  onBack,
}: CategoryDetailProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const icon = categoryIconName(category.icon);
  const accent = categoryAccent(category.color);
  const memberById = new Map(members.map((member) => [member.id, member] as const));

  const monthTransactions = transactions
    .filter(
      (transaction) =>
        transaction.categoryId === category.id && transaction.occurredAt.slice(0, 7) === monthKey,
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const status = budget ? computeCategoryBudgetStatus(transactions, budget, monthKey) : null;
  const displayName = resolveCategoryDisplayName(category, language);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={displayName} onBack={onBack} />

      {status ? (
        <>
          <Card elevated style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <ProgressRing
              progress={status.percentage === Infinity ? 1 : status.percentage / 100}
              accent={accent}
              alertThreshold={1}
              centerValue={status.percentage === Infinity ? '—' : `${Math.round(status.percentage)}%`}
              centerLabel={`${formatMoney(status.spentMinor, currencyCode, language)} / ${formatMoney(status.capMinor, currencyCode, language)}`}
              accessibilityLabel={t('categoryDetail.ringA11yLabel', {
                percentage: status.percentage === Infinity ? 100 : Math.round(status.percentage),
              })}
              size={140}
              strokeWidth={14}
            />
            {status.rolloverMinor !== 0 ? (
              <Txt size="xs" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
                {status.rolloverMinor > 0
                  ? t('categoryDetail.rolloverBonus', {
                      amount: formatMoney(status.rolloverMinor, currencyCode, language),
                    })
                  : t('categoryDetail.rolloverDeficit', {
                      amount: formatMoney(-status.rolloverMinor, currencyCode, language),
                    })}
              </Txt>
            ) : null}
          </Card>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <StatCard
              icon={icon}
              accent={accent}
              label={t('categoryDetail.spentTile')}
              value={formatMoney(status.spentMinor, currencyCode, language)}
              style={{ flex: 1 }}
            />
            <StatCard
              icon="banknote"
              accent="teal"
              label={t('categoryDetail.capTile')}
              value={formatMoney(status.capMinor, currencyCode, language)}
              style={{ flex: 1 }}
            />
            <StatCard
              icon={status.isOverBudget ? 'alert-triangle' : 'check-circle'}
              accent={status.isOverBudget ? 'coral' : 'teal'}
              label={t('categoryDetail.remainingTile')}
              value={formatMoney(status.capMinor - status.spentMinor, currencyCode, language)}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : (
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('categoryDetail.noBudget')}
          </Txt>
        </Card>
      )}

      <Button label={t('categoryDetail.editButton')} onPress={onEdit} />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt weight="semibold" size="md">
          {t('categoryDetail.transactionsTitle')}
        </Txt>
        {monthTransactions.length === 0 ? (
          <Card elevated>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('categoryDetail.noTransactions')}
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {monthTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                icon={icon}
                accent={accent}
                title={transaction.note || displayName}
                occurredAt={transaction.occurredAt}
                memberName={memberById.get(transaction.memberId)?.name}
                amountMinor={
                  transaction.type === 'income' ? transaction.amountMinor : -transaction.amountMinor
                }
                currencyCode={transaction.currencyCode}
              />
            ))}
          </View>
        )}
      </View>
    </AppScreen>
  );
}
