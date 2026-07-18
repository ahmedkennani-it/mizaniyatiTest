import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useExpenseEntry } from './ExpenseEntryProvider';
import { AppScreen, Card, Chip, ScreenHeader, TransactionRow, Txt } from '../components';
import { resolveCategoryDisplayName } from '../categories';
import { categoryAccent, categoryIconName } from '../categories/categoryVisual';
import { getDatabase } from '../db/client';
import { listAllMembers, listCategories, listTransactions } from '../db/repositories';
import type { Category, Member, Transaction } from '../db/repositories';
import { useLanguage } from '../i18n';
import { NO_FILTERS, filterTransactions } from '../transactions';
import type { TransactionTypeFilter } from '../transactions';
import { useTheme } from '../theme';

export interface TransactionHistoryScreenProps {
  onBack: () => void;
}

/**
 * The full history behind the dashboard's "Voir tout" (US-012). Unlike the dashboard it is **not**
 * month-scoped: this is precisely the history the month selector hides, so scoping it would leave
 * the app with nowhere to see everything.
 */
export function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { openEntry, dataVersion } = useExpenseEntry();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState(NO_FILTERS);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listTransactions(db).then(setTransactions);
    listCategories(db).then(setCategories);
    listAllMembers(db).then(setMembers);
  }, []);

  useEffect(refresh, [refresh, dataVersion]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const visible = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  const typeFilters: { value: TransactionTypeFilter; label: string }[] = [
    { value: 'all', label: t('history.filterAll') },
    { value: 'expense', label: t('history.filterExpense') },
    { value: 'income', label: t('history.filterIncome') },
  ];

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('history.title')} onBack={onBack} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
      >
        {typeFilters.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            selected={filters.type === filter.value}
            onPress={() => setFilters((previous) => ({ ...previous, type: filter.value }))}
          />
        ))}
      </ScrollView>

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('history.categoryFilterLabel')}
        </Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
        >
          <Chip
            label={t('history.allCategories')}
            selected={filters.categoryId === null}
            onPress={() => setFilters((previous) => ({ ...previous, categoryId: null }))}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={resolveCategoryDisplayName(category, language)}
              selected={filters.categoryId === category.id}
              onPress={() => setFilters((previous) => ({ ...previous, categoryId: category.id }))}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('history.memberFilterLabel')}
        </Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
        >
          <Chip
            label={t('history.allMembers')}
            selected={filters.memberId === null}
            onPress={() => setFilters((previous) => ({ ...previous, memberId: null }))}
          />
          {members.map((member) => (
            <Chip
              key={member.id}
              label={member.name}
              selected={filters.memberId === member.id}
              onPress={() => setFilters((previous) => ({ ...previous, memberId: member.id }))}
            />
          ))}
        </ScrollView>
      </View>

      <Txt size="xs" color={theme.colors.textSecondary}>
        {t('history.countLabel', { count: visible.length })}
      </Txt>

      {visible.length === 0 ? (
        <Card elevated style={{ paddingVertical: theme.spacing.xl }}>
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('history.empty')}
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {visible.map((transaction) => {
            const category = categoryById.get(transaction.categoryId);
            const isIncome = transaction.type === 'income';
            return (
              <TransactionRow
                key={transaction.id}
                icon={categoryIconName(category?.icon ?? 'ellipsis')}
                accent={categoryAccent(category?.color)}
                title={
                  transaction.note ||
                  (category ? resolveCategoryDisplayName(category, language) : null) ||
                  transaction.occurredAt.slice(0, 10)
                }
                occurredAt={transaction.occurredAt}
                memberName={memberById.get(transaction.memberId)?.name}
                amountMinor={isIncome ? transaction.amountMinor : -transaction.amountMinor}
                currencyCode={transaction.currencyCode}
                onPress={() => openEntry(transaction)}
              />
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
