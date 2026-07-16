import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useExpenseEntry } from './ExpenseEntryProvider';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';
import {
  AppScreen,
  BalanceHeroCard,
  Button,
  Card,
  DonutBreakdown,
  GoalCard,
  MonthSelector,
  ScreenHeader,
  SectionHeader,
  TransactionRow,
  TrustChip,
  Txt,
  VoicePromoCard,
} from '../components';
import type { AccentName } from '../theme';
import type { DonutSegment } from '../components';
import { categoryAccent, categoryIconName } from '../categories/categoryVisual';
import { getDatabase } from '../db/client';
import {
  listCategories,
  listHouseholds,
  listMembers,
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
import { useLanguage } from '../i18n';
import { formatMonthLabel, monthKeyOf, monthKeyToDate } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { DEFAULT_CURRENCY_CODE, formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeCategoryBreakdown, rankCategories } from '../transactions';
import { computeVaultStatus } from '../vaults';
import type { RootTabParamList } from '../navigation';

const GOAL_ACCENTS: AccentName[] = ['teal', 'gold', 'purple', 'blue', 'coral'];

const RECENT_TRANSACTION_COUNT = 4;

/**
 * React Navigation hands every tab screen its `navigation`; it is optional here so the screen
 * still mounts on its own in tests, like every other screen in this codebase, which take plain
 * callbacks rather than reaching for a navigation container.
 */
export type HomeScreenProps = Partial<Pick<BottomTabScreenProps<RootTabParamList, 'home'>, 'navigation'>>;

export function HomeScreen({ navigation }: HomeScreenProps = {}) {
  const { t } = useTranslation();
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { openEntry, dataVersion } = useExpenseEntry();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [contributions, setContributions] = useState<VaultContribution[]>([]);
  const [monthKey, setMonthKey] = useState<string>(() => monthKeyOf(new Date()));

  const refresh = useCallback(() => {
    const db = getDatabase();
    listTransactions(db).then(setTransactions);
    listCategories(db).then(setCategories);
    listMembers(db).then(setMembers);
    listHouseholds(db).then(setHouseholds);
    listVaults(db).then(setVaults);
    listVaultContributions(db).then(setContributions);
  }, []);

  // Refetch on mount and after every add/edit/delete (the FAB flow bumps `dataVersion`).
  useEffect(refresh, [refresh, dataVersion]);

  // ── Derived aggregates (recomputed every render; cheap at MVP volumes) ──────────
  const { balanceMinor, incomeMinor, expenseMinor } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const transaction of transactions) {
      if (transaction.occurredAt.slice(0, 7) !== monthKey) continue;
      if (transaction.type === 'income') income += transaction.amountMinor;
      else expense += transaction.amountMinor;
    }
    return { balanceMinor: income - expense, incomeMinor: income, expenseMinor: expense };
  }, [transactions, monthKey]);

  const breakdown = useMemo(
    () => computeCategoryBreakdown(transactions, categories, monthKey),
    [transactions, categories, monthKey],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    for (const member of members) map.set(member.id, member);
    return map;
  }, [members]);

  // The household's own currency, not the launch market's — a France household budgets in EUR.
  // Falls back to the launch default only until the household row has loaded.
  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  // Number-only, LTR, localized digits (currency shown separately in the design).
  const num = useCallback(
    (minor: number) =>
      forceLTR(toLocalizedDigits(toMajorUnits(minor, currencyCode), language)),
    [currencyCode, language],
  );

  const monthLabel = useMemo(() => formatMonthLabel(monthKey, language), [language, monthKey]);

  // The member is the person greeted; the household is the budget's name. They used to be the
  // same string, which greeted the user with "Moi" (US-005).
  const firstName = members[0]?.name;
  const householdName = households[0]?.name ?? t('home.household');

  /**
   * Top categories plus an aggregate "Autres" (US-010). The tail is summed rather than dropped, so
   * the slices still add up to the figure in the middle of the ring.
   */
  const segments: DonutSegment[] = rankCategories(breakdown, t('home.breakdownOthers')).map(
    (entry) => ({
      label: entry.categoryName,
      value: entry.totalMinor,
      valueLabel: num(entry.totalMinor),
      accent: entry.isOthers ? 'blue' : categoryAccent(categoryById.get(entry.categoryId)?.color),
      // "Autres" stands for several categories, so there is no single detail to open.
      // The per-category detail screen lands with the categories stories (phase 7); until then a
      // slice opens the Categories tab, which is where that detail will live.
      onPress: entry.isOthers ? undefined : () => navigation?.navigate('categories'),
    }),
  );

  // The current month is the ceiling: there is nothing to show past it, and letting the user walk
  // into empty future months reads as a bug rather than a feature (US-008).
  const currentMonthKey = monthKeyOf(new Date());
  const isAtCurrentMonth = monthKey >= currentMonthKey;

  const stepMonth = (delta: number) => {
    const next = monthKeyToDate(monthKey);
    next.setMonth(next.getMonth() + delta);
    const stepped = monthKeyOf(next);
    setMonthKey(stepped > currentMonthKey ? currentMonthKey : stepped);
  };

  // Scoped to the selected month, like every other figure on this screen — the list used to show
  // the 5 latest transactions overall, so browsing to June listed July's (US-008).
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.occurredAt.slice(0, 7) === monthKey),
    [transactions, monthKey],
  );
  // US-012 asks for the last four; the full list is one tap away behind "Voir tout".
  const recent = monthTransactions.slice(0, RECENT_TRANSACTION_COUNT);

  /**
   * A goal is cumulative, not monthly, so "reflecting" a past month means showing what had been
   * saved **by the end of it** — not only that month's deposits, which would read as a goal that
   * lost its progress. Contributions after the selected month are simply not known yet from that
   * month's vantage point (US-008).
   */
  const contributionsUpToMonth = useMemo(
    () => contributions.filter((contribution) => contribution.date.slice(0, 7) <= monthKey),
    [contributions, monthKey],
  );

  if (view === 'history') {
    return <TransactionHistoryScreen onBack={() => setView('dashboard')} />;
  }

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        greeting={t('home.greeting')}
        name={firstName}
        householdName={householdName}
        actions={[
          {
            icon: 'globe',
            text: language.toUpperCase(),
            accessibilityLabel: t('home.a11yLanguage'),
          },
          { icon: 'bell', badge: true, accessibilityLabel: t('home.a11yNotifications') },
        ]}
      />

      <MonthSelector
        label={monthLabel}
        onPrev={() => stepMonth(-1)}
        onNext={() => stepMonth(1)}
        disableNext={isAtCurrentMonth}
      />

      <BalanceHeroCard
        label={t('home.balanceLabel')}
        amountMinor={balanceMinor}
        currencyCode={currencyCode}
        gradient={balanceMinor < 0 ? 'negative' : 'balance'}
        progress={incomeMinor > 0 ? Math.max(0, balanceMinor) / incomeMinor : undefined}
        footerStart={{
          label: t('home.balanceIncome'),
          value: formatMoney(incomeMinor, currencyCode, language),
        }}
        footerEnd={{
          label: t('home.balanceExpense'),
          value: formatMoney(expenseMinor, currencyCode, language),
        }}
      />

      <TrustChip label={t('home.disclaimer')} />

      <VoicePromoCard
        title={t('home.voiceTitle')}
        subtitle={t('home.voiceSubtitle')}
        badge={t('home.voiceBadge')}
        onPress={() => openEntry()}
      />

      <Card elevated testID="category-breakdown">
        <Txt weight="semibold" size="md" style={{ marginBottom: theme.spacing.sm }}>
          {t('home.breakdownTitle')}
        </Txt>
        {segments.length === 0 ? (
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('home.breakdownEmpty')}
          </Txt>
        ) : (
          <DonutBreakdown
            segments={segments}
            centerLabel={t('home.spentLabel')}
            centerValue={num(expenseMinor)}
            centerSubLabel={currencyCode}
          />
        )}
      </Card>

      {vaults.length > 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('home.goalsTitle')} actionLabel={t('home.seeAll')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
          >
            {vaults.map((vault, index) => {
              const status = computeVaultStatus(vault, contributionsUpToMonth);
              return (
                <GoalCard
                  key={vault.id}
                  icon="piggy-bank"
                  accent={GOAL_ACCENTS[index % GOAL_ACCENTS.length]}
                  title={vault.name}
                  progress={status.percentage === Infinity ? 1 : status.percentage / 100}
                  caption={`${num(status.savedMinor)} / ${num(vault.targetMinor)} ${vault.currencyCode}`}
                  style={{ width: 160 }}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <SectionHeader
        title={t('home.recentTitle')}
        actionLabel={recent.length > 0 ? t('home.seeAll') : undefined}
        onActionPress={() => setView('history')}
      />

      {recent.length === 0 ? (
        <Card
          elevated
          style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl }}
        >
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('home.emptyState')}
          </Txt>
          <Button label={t('home.addButton')} onPress={() => openEntry()} />
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {recent.map((transaction) => {
            const category = categoryById.get(transaction.categoryId);
            const member = memberById.get(transaction.memberId);
            const isIncome = transaction.type === 'income';
            return (
              <TransactionRow
                key={transaction.id}
                icon={categoryIconName(category?.icon ?? 'ellipsis')}
                accent={categoryAccent(category?.color)}
                title={transaction.note || category?.name || transaction.occurredAt.slice(0, 10)}
                occurredAt={transaction.occurredAt}
                memberName={member?.name}
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
