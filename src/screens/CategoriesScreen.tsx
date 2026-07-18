import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryDetail } from './CategoryDetail';
import { CategoryForm } from './CategoryForm';
import { useExpenseEntry } from './ExpenseEntryProvider';
import { PaywallScreen } from './PaywallScreen';
import { computeCategoryBudgetStatus, resolveCategoryDisplayName } from '../categories';
import { categoryAccent, categoryIconName } from '../categories/categoryVisual';
import { nextMonthKey, previousMonthKey } from '../calendar';
import {
  AlertBanner,
  AppScreen,
  Card,
  CategoryBudgetRow,
  ListRow,
  MonthSelector,
  ScreenHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { listCategories, listCategoryBudgets, listMembers, listTransactions } from '../db/repositories';
import type { Category, CategoryBudget, Member, Transaction } from '../db/repositories';
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
  const { dataVersion } = useExpenseEntry();

  const [view, setView] = useState<'list' | 'form' | 'detail' | 'paywall'>('list');
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey());
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listCategories(db).then(setCategories);
    listTransactions(db).then(setTransactions);
    listCategoryBudgets(db).then(setBudgets);
    listMembers(db).then(setMembers);
  }, []);

  // US-024: an edit/delete from the entry form bumps `dataVersion` — this screen's own totals
  // (budget status, over-cap banner) must reflect it without waiting for a remount.
  useEffect(() => {
    refresh();
  }, [refresh, dataVersion]);

  const num = useCallback(
    (minor: number) =>
      forceLTR(toLocalizedDigits(toMajorUnits(minor, DEFAULT_CURRENCY_CODE), language)),
    [language],
  );

  const monthLabel = useMemo(
    () => formatMonthLabel(selectedMonthKey, language),
    [selectedMonthKey, language],
  );

  const openDetail = useCallback((category: Category) => {
    setDetailCategory(category);
    setView('detail');
  }, []);

  if (view === 'paywall') {
    return <PaywallScreen onBack={() => setView('list')} />;
  }

  if (view === 'detail' && detailCategory) {
    const budget = budgets.find((candidate) => candidate.categoryId === detailCategory.id);
    return (
      <CategoryDetail
        category={detailCategory}
        budget={budget}
        transactions={transactions}
        members={members}
        monthKey={selectedMonthKey}
        currencyCode={DEFAULT_CURRENCY_CODE}
        onEdit={() => {
          setEditingCategory(detailCategory);
          setView('form');
        }}
        onBack={() => {
          setDetailCategory(null);
          setView('list');
        }}
      />
    );
  }

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
          setDetailCategory(null);
          setView('list');
        }}
        onCancel={() => {
          setEditingCategory(null);
          setView(detailCategory ? 'detail' : 'list');
        }}
        onDeleted={() => {
          refresh();
          setEditingCategory(null);
          setDetailCategory(null);
          setView('list');
        }}
      />
    );
  }

  const categoryLimit = entitlements.limit('categories.max');
  const atLimit = categories.length >= categoryLimit;

  const openCreate = () => {
    if (atLimit) {
      setView('paywall');
      return;
    }
    setEditingCategory(null);
    setView('form');
  };

  // Every over-budget category for the selected month drives the top banner — aggregated once
  // there's more than one (US-026: "2 catégories dépassées"), tap-through only when there's
  // exactly one unambiguous "catégorie concernée" to open.
  const overCategories = categories
    .map((category) => {
      const budget = budgets.find((candidate) => candidate.categoryId === category.id);
      if (!budget) return null;
      const status = computeCategoryBudgetStatus(transactions, budget, selectedMonthKey);
      return status.isOverBudget ? { category, status } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={t('categoriesScreen.title')}
        actions={[
          { icon: 'plus', onPress: openCreate, accessibilityLabel: t('categoriesScreen.a11yAdd') },
        ]}
      />
      <MonthSelector
        label={`${monthLabel} · ${t('categoriesScreen.capsSubtitle')}`}
        onPrev={() => setSelectedMonthKey((month) => previousMonthKey(month))}
        onNext={() => setSelectedMonthKey((month) => nextMonthKey(month))}
        disableNext={nextMonthKey(selectedMonthKey) > currentMonthKey()}
      />

      {overCategories.length === 1 ? (
        <AlertBanner
          message={t('categoriesScreen.overBanner', {
            name: resolveCategoryDisplayName(overCategories[0].category, language),
            amount: formatMoney(overCategories[0].status.overageMinor, DEFAULT_CURRENCY_CODE, language),
          })}
          onPress={() => openDetail(overCategories[0].category)}
        />
      ) : overCategories.length > 1 ? (
        <AlertBanner
          message={t('categoriesScreen.overBannerAggregate', { count: overCategories.length })}
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
          const displayName = resolveCategoryDisplayName(category, language);

          if (!budget) {
            return (
              <ListRow
                key={category.id}
                icon={icon}
                accent={accent}
                title={displayName}
                chevron
                onPress={() => openDetail(category)}
              />
            );
          }

          const status = computeCategoryBudgetStatus(transactions, budget, selectedMonthKey);
          return (
            <CategoryBudgetRow
              key={category.id}
              icon={icon}
              accent={accent}
              name={displayName}
              amountLabel={`${num(status.spentMinor)} / ${num(status.capMinor)} ${DEFAULT_CURRENCY_CODE}`}
              progress={status.percentage === Infinity ? 1 : status.percentage / 100}
              over={status.isOverBudget}
              percentLabel={
                status.percentage === Infinity ? undefined : `${Math.round(status.percentage)}%`
              }
              onPress={() => openDetail(category)}
            />
          );
        })}
      </View>
    </AppScreen>
  );
}
