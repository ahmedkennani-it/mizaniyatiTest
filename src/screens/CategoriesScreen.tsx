import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryForm } from './CategoryForm';
import { computeCategoryBudgetStatus } from '../categories';
import { categoryAccent, categoryIconName } from '../categories/categoryVisual';
import {
  AlertBanner,
  AppScreen,
  Card,
  CategoryBudgetRow,
  ListRow,
  ScreenHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { listCategories, listCategoryBudgets, listTransactions } from '../db/repositories';
import type { Category, CategoryBudget, Transaction } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { formatMonthLabel } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { DEFAULT_CURRENCY_CODE, formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function CategoriesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listCategories(db).then(setCategories);
    listTransactions(db).then(setTransactions);
    listCategoryBudgets(db).then(setBudgets);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const num = useCallback(
    (minor: number) =>
      forceLTR(toLocalizedDigits(toMajorUnits(minor, DEFAULT_CURRENCY_CODE), language)),
    [language],
  );

  const monthLabel = useMemo(() => formatMonthLabel(currentMonthKey(), language), [language]);

  if (view === 'form') {
    const otherCategories = editingCategory
      ? categories.filter((candidate) => candidate.id !== editingCategory.id)
      : categories;
    const transactionsToReassign = editingCategory
      ? transactions.filter((transaction) => transaction.categoryId === editingCategory.id)
      : [];
    const budget = editingCategory
      ? (budgets.find((candidate) => candidate.categoryId === editingCategory.id) ?? undefined)
      : undefined;
    return (
      <CategoryForm
        category={editingCategory ?? undefined}
        budget={budget}
        otherCategories={otherCategories}
        transactionsToReassign={transactionsToReassign}
        onSaved={() => {
          refresh();
          setEditingCategory(null);
          setView('list');
        }}
        onCancel={() => {
          setEditingCategory(null);
          setView('list');
        }}
        onDeleted={() => {
          refresh();
          setEditingCategory(null);
          setView('list');
        }}
      />
    );
  }

  const categoryLimit = entitlements.limit('categories.max');
  const atLimit = categories.length >= categoryLimit;

  const openCreate = () => {
    if (atLimit) return;
    setEditingCategory(null);
    setView('form');
  };

  // First over-budget category drives the top alert banner (matching the design).
  const firstOver = categories
    .map((category) => {
      const budget = budgets.find((candidate) => candidate.categoryId === category.id);
      if (!budget) return null;
      const status = computeCategoryBudgetStatus(transactions, budget, currentMonthKey());
      return status.isOverBudget ? { category, status } : null;
    })
    .find((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={t('categoriesScreen.title')}
        actions={[
          { icon: 'plus', onPress: openCreate, accessibilityLabel: t('categoriesScreen.a11yAdd') },
        ]}
      />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {`${monthLabel} · ${t('categoriesScreen.capsSubtitle')}`}
      </Txt>

      {firstOver ? (
        <AlertBanner
          message={t('categoriesScreen.overBanner', {
            name: firstOver.category.name,
            amount: formatMoney(firstOver.status.overageMinor, DEFAULT_CURRENCY_CODE, language),
          })}
        />
      ) : null}

      {atLimit ? (
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('categoriesScreen.limitReachedMessage', { limit: categoryLimit })}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('categoriesScreen.limitReachedUpsell')}
          </Txt>
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        {categories.map((category) => {
          const icon = categoryIconName(category.icon);
          const accent = categoryAccent(category.color);
          const budget = budgets.find((candidate) => candidate.categoryId === category.id);
          const openEdit = () => {
            setEditingCategory(category);
            setView('form');
          };

          if (!budget) {
            return (
              <ListRow
                key={category.id}
                icon={icon}
                accent={accent}
                title={category.name}
                chevron
                onPress={openEdit}
              />
            );
          }

          const status = computeCategoryBudgetStatus(transactions, budget, currentMonthKey());
          return (
            <CategoryBudgetRow
              key={category.id}
              icon={icon}
              accent={accent}
              name={category.name}
              amountLabel={`${num(status.spentMinor)} / ${num(status.capMinor)} ${DEFAULT_CURRENCY_CODE}`}
              progress={status.percentage === Infinity ? 1 : status.percentage / 100}
              over={status.isOverBudget}
              percentLabel={
                status.percentage === Infinity ? undefined : `${Math.round(status.percentage)}%`
              }
              onPress={openEdit}
            />
          );
        })}
      </View>
    </AppScreen>
  );
}
