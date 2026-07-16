import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useExpenseEntry } from './ExpenseEntryProvider';
import {
  AppScreen,
  BalanceHeroCard,
  Button,
  Card,
  DonutBreakdown,
  GoalCard,
  ListRow,
  MonthSelector,
  ScreenHeader,
  SectionHeader,
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
  listMembers,
  listTransactions,
  listVaultContributions,
  listVaults,
} from '../db/repositories';
import type { Category, Member, Transaction, Vault, VaultContribution } from '../db/repositories';
import { useLanguage } from '../i18n';
import { formatMonthLabel, monthKeyOf, monthKeyToDate } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { DEFAULT_CURRENCY_CODE, formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeCategoryBreakdown } from '../transactions';
import { computeVaultStatus } from '../vaults';

const GOAL_ACCENTS: AccentName[] = ['teal', 'gold', 'purple', 'blue', 'coral'];

export function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { openEntry, dataVersion } = useExpenseEntry();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [contributions, setContributions] = useState<VaultContribution[]>([]);
  const [monthKey, setMonthKey] = useState<string>(() => monthKeyOf(new Date()));

  const refresh = useCallback(() => {
    const db = getDatabase();
    listTransactions(db).then(setTransactions);
    listCategories(db).then(setCategories);
    listMembers(db).then(setMembers);
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

  // Number-only, LTR, localized digits (currency shown separately in the design).
  const num = useCallback(
    (minor: number) =>
      forceLTR(toLocalizedDigits(toMajorUnits(minor, DEFAULT_CURRENCY_CODE), language)),
    [language],
  );

  const monthLabel = useMemo(() => formatMonthLabel(monthKey, language), [language, monthKey]);

  const householdName = members[0]?.name ?? t('home.household');

  const segments: DonutSegment[] = breakdown.map((entry) => ({
    label: entry.categoryName,
    value: entry.totalMinor,
    valueLabel: num(entry.totalMinor),
    accent: categoryAccent(categoryById.get(entry.categoryId)?.color),
  }));

  const stepMonth = (delta: number) => {
    const next = monthKeyToDate(monthKey);
    next.setMonth(next.getMonth() + delta);
    setMonthKey(monthKeyOf(next));
  };

  const recent = transactions.slice(0, 5);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        greeting={t('home.greeting')}
        name={householdName}
        actions={[
          {
            icon: 'globe',
            text: language.toUpperCase(),
            accessibilityLabel: t('home.a11yLanguage'),
          },
          { icon: 'bell', badge: true, accessibilityLabel: t('home.a11yNotifications') },
        ]}
      />

      <MonthSelector label={monthLabel} onPrev={() => stepMonth(-1)} onNext={() => stepMonth(1)} />

      <BalanceHeroCard
        label={t('home.balanceLabel')}
        amountMinor={balanceMinor}
        currencyCode={DEFAULT_CURRENCY_CODE}
        progress={incomeMinor > 0 ? Math.max(0, balanceMinor) / incomeMinor : undefined}
        footerStart={{
          label: t('home.balanceIncome'),
          value: formatMoney(incomeMinor, DEFAULT_CURRENCY_CODE, language),
        }}
        footerEnd={{
          label: t('home.balanceExpense'),
          value: formatMoney(expenseMinor, DEFAULT_CURRENCY_CODE, language),
        }}
      />

      <TrustChip label={t('home.disclaimer')} />

      <VoicePromoCard
        title={t('home.voiceTitle')}
        subtitle={t('home.voiceSubtitle')}
        badge={t('home.voiceBadge')}
        onPress={() => openEntry()}
      />

      <Card elevated>
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
            centerSubLabel={DEFAULT_CURRENCY_CODE}
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
              const status = computeVaultStatus(vault, contributions);
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
            const signedMinor = isIncome ? transaction.amountMinor : -transaction.amountMinor;
            const dateLabel = transaction.occurredAt.slice(0, 10);
            return (
              <ListRow
                key={transaction.id}
                icon={categoryIconName(category?.icon ?? 'ellipsis')}
                accent={categoryAccent(category?.color)}
                title={transaction.note || category?.name || dateLabel}
                subtitle={member ? `${dateLabel} · ${member.name}` : dateLabel}
                value={formatMoney(signedMinor, transaction.currencyCode, language)}
                valueColor={isIncome ? theme.colors.success : theme.colors.textPrimary}
                onPress={() => openEntry(transaction)}
              />
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
