import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useExpenseEntry } from './ExpenseEntryProvider';
import { RamadanScreen } from './RamadanScreen';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';
import { VaultsScreen } from './VaultsScreen';
import { ZakatScreen } from './ZakatScreen';
import {
  AppScreen,
  BalanceHeroCard,
  Button,
  Card,
  DonutBreakdown,
  GoalCard,
  IconTile,
  MonthSelector,
  ScreenHeader,
  SectionHeader,
  StatCard,
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
  dismissRamadanSuggestion,
  dismissVoicePromo,
  getUserSettings,
  listCategories,
  listHouseholds,
  listMembers,
  listSeasonalThemes,
  listTransactions,
  listVaultContributions,
  listVaults,
  updateSeasonalTheme,
} from '../db/repositories';
import type {
  Category,
  Household,
  Member,
  SeasonalTheme,
  Transaction,
  UserSettings,
  Vault,
  VaultContribution,
} from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { formatMonthLabel, monthKeyOf, monthKeyToDate } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { marketHasModule, originMarket } from '../market';
import { DEFAULT_CURRENCY_CODE, formatMoney, toMajorUnits } from '../money';
import { computeSeasonalThemeStatus, gregorianToHijri, shouldSuggestRamadanActivation } from '../seasonalThemes';
import { useTheme } from '../theme';
import { computeCategoryBreakdown, rankCategories } from '../transactions';
import { computeVaultStatus } from '../vaults';
import { shouldShowVoicePromo } from '../voice';
import type { RootTabParamList } from '../navigation';

const GOAL_ACCENTS: AccentName[] = ['teal', 'gold', 'purple', 'blue', 'coral'];

const RECENT_TRANSACTION_COUNT = 4;

/** US-011: the dashboard previews the first two goals; the rest live behind "Voir tout". */
const GOAL_PREVIEW_COUNT = 2;

/**
 * React Navigation hands every tab screen its `navigation`; it is optional here so the screen
 * still mounts on its own in tests, like every other screen in this codebase, which take plain
 * callbacks rather than reaching for a navigation container.
 */
export type HomeScreenProps = Partial<Pick<BottomTabScreenProps<RootTabParamList, 'home'>, 'navigation'>>;

export function HomeScreen({ navigation }: HomeScreenProps = {}) {
  const { t } = useTranslation();
  const [view, setView] = useState<'dashboard' | 'history' | 'vaults' | 'ramadan' | 'zakat'>(
    'dashboard',
  );
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();
  const { openEntry, openVoiceEntry, dataVersion } = useExpenseEntry();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [contributions, setContributions] = useState<VaultContribution[]>([]);
  const [seasonalThemes, setSeasonalThemes] = useState<SeasonalTheme[]>([]);
  const [monthKey, setMonthKey] = useState<string>(() => monthKeyOf(new Date()));

  const refresh = useCallback(() => {
    const db = getDatabase();
    listTransactions(db).then(setTransactions);
    listCategories(db).then(setCategories);
    listMembers(db).then(setMembers);
    listHouseholds(db).then(setHouseholds);
    getUserSettings(db).then(setSettings);
    listVaults(db).then(setVaults);
    listVaultContributions(db).then(setContributions);
    listSeasonalThemes(db).then(setSeasonalThemes);
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
   * The first-run invitation, gone once the household has recorded anything (US-015) — across
   * **all** months, not just the selected one: "Ajoute ta première opération" would be plainly
   * wrong on an empty month of a household with two years of history.
   *
   * US-015 says it disappears "définitivement". Read as: it goes because there *is* data, not as a
   * one-way flag. A household that deletes everything is back to an empty app, and the invitation
   * is useful again — persisting a "has ever recorded" bit to withhold it would be worse, not
   * truer to the story.
   */
  const hasEverRecorded = transactions.length > 0;

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

  // The dashboard only switches identity for an *entitled* household — an expired/free plan sees
  // its regular dashboard even if a theme row was activated while still on Pro (US-041).
  const activeRamadanTheme =
    entitlements.can('ramadan')
      ? (seasonalThemes.find((candidate) => candidate.type === 'ramadan' && candidate.active) ??
        null)
      : null;
  const ramadanStatus = activeRamadanTheme
    ? computeSeasonalThemeStatus(activeRamadanTheme, categories, transactions)
    : null;

  const now = new Date();
  const currentHijriYear = gregorianToHijri(now).year;
  // Never nag once a theme is active (nothing to suggest), and never nag twice in the same
  // approximate Hijri year once dismissed — but a new year's Ramadan gets its own chance.
  const showRamadanSuggestion =
    entitlements.can('ramadan') &&
    !activeRamadanTheme &&
    shouldSuggestRamadanActivation(now) &&
    settings?.ramadanSuggestionDismissedHijriYear !== currentHijriYear;

  if (view === 'history') {
    return <TransactionHistoryScreen onBack={() => setView('dashboard')} />;
  }

  if (view === 'vaults') {
    return <VaultsScreen onBack={() => setView('dashboard')} />;
  }

  if (view === 'ramadan') {
    return (
      <RamadanScreen
        onBack={() => setView('dashboard')}
        onNavigateToZakat={() => setView('zakat')}
      />
    );
  }

  if (view === 'zakat') {
    return <ZakatScreen onBack={() => setView('dashboard')} />;
  }

  if (activeRamadanTheme && ramadanStatus) {
    const ramadanHeaderActions = [
      {
        icon: 'globe' as const,
        text: language.toUpperCase(),
        accessibilityLabel: t('home.a11yLanguage'),
      },
      { icon: 'bell' as const, badge: true, accessibilityLabel: t('home.a11yNotifications') },
    ];

    if (ramadanStatus.isEnded) {
      return (
        <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
          <ScreenHeader title={t('ramadanScreen.title')} actions={ramadanHeaderActions} />
          <Card elevated style={{ gap: theme.spacing.sm }}>
            <Txt weight="semibold" size="md">
              {t('ramadanScreen.recapTitle')}
            </Txt>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('ramadanScreen.recapMessage')}
            </Txt>
            <Txt size="sm">
              {t('ramadanScreen.spentLabel')}:{' '}
              {formatMoney(ramadanStatus.spentMinor, activeRamadanTheme.currencyCode, language)}
            </Txt>
            <Txt size="sm">
              {t('ramadanScreen.envelopeLabel')}:{' '}
              {formatMoney(
                activeRamadanTheme.envelopeMinor,
                activeRamadanTheme.currencyCode,
                language,
              )}
            </Txt>
            <Button
              label={t('ramadanScreen.revertButton')}
              onPress={async () => {
                await updateSeasonalTheme(getDatabase(), activeRamadanTheme.id, { active: false });
                refresh();
              }}
            />
          </Card>
        </AppScreen>
      );
    }

    const ramadanProgress =
      activeRamadanTheme.envelopeMinor > 0
        ? Math.max(0, ramadanStatus.remainingMinor) / activeRamadanTheme.envelopeMinor
        : undefined;

    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('ramadanScreen.title')} actions={ramadanHeaderActions} />

        <BalanceHeroCard
          label={t('ramadanScreen.envelopeTitle')}
          amountMinor={ramadanStatus.remainingMinor}
          currencyCode={activeRamadanTheme.currencyCode}
          gradient="ramadan"
          barColor={theme.onAccent.accentGold}
          cornerIcon="moon-star"
          progress={ramadanProgress}
          footerStart={{
            label: t('ramadanScreen.envelopeLabel'),
            value: formatMoney(
              activeRamadanTheme.envelopeMinor,
              activeRamadanTheme.currencyCode,
              language,
            ),
          }}
          footerEnd={{
            label: t('ramadanScreen.daysRemainingShortLabel'),
            value: String(ramadanStatus.daysRemaining),
          }}
        />

        <TrustChip label={t('home.disclaimer')} />

        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('ramadanScreen.subcategoriesTitle')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {ramadanStatus.categorySpend.map(({ category, spentMinor }) => (
              <StatCard
                key={category.id}
                icon={categoryIconName(category.icon)}
                accent={categoryAccent(category.color)}
                label={category.name}
                value={formatMoney(spentMinor, activeRamadanTheme.currencyCode, language)}
                style={{ width: '47%' }}
              />
            ))}
          </View>
        </View>

        <Button
          label={t('ramadanScreen.zakatShortcutWithRate')}
          variant="secondary"
          icon="moon-star"
          onPress={() => setView('zakat')}
        />
      </AppScreen>
    );
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

      {/* Approximate Hijri-calendar nudge (US-041) — never shown once a theme is active, and
          silenced for the rest of this approximate Hijri year once dismissed. */}
      {showRamadanSuggestion ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <IconTile icon="moon-star" accent="gold" />
            <Txt weight="semibold" size="md" style={{ flex: 1 }}>
              {t('ramadanScreen.suggestionTitle')}
            </Txt>
          </View>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('ramadanScreen.suggestionMessage')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              label={t('ramadanScreen.suggestionActivate')}
              onPress={() => setView('ramadan')}
              style={{ flex: 1 }}
            />
            <Button
              label={t('ramadanScreen.suggestionDismiss')}
              variant="secondary"
              style={{ flex: 1 }}
              onPress={async () => {
                await dismissRamadanSuggestion(getDatabase(), currentHijriYear);
                refresh();
              }}
            />
          </View>
        </Card>
      ) : null}

      <MonthSelector
        label={monthLabel}
        onPrev={() => stepMonth(-1)}
        onNext={() => stepMonth(1)}
        disableNext={isAtCurrentMonth}
      />

      <BalanceHeroCard
        label={t('home.balanceLabel')}
        amountMinor={monthTransactions.length === 0 ? null : balanceMinor}
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

      {/* A discovery aid, not a permanent ad: it retires itself once the household has used
          voice or said no thanks (US-014). */}
      {shouldShowVoicePromo(settings) ? (
        <VoicePromoCard
          title={t('home.voiceTitle')}
          subtitle={t('home.voiceSubtitle')}
          badge={t('home.voiceBadge')}
          onPress={openVoiceEntry}
          onDismiss={async () => {
            await dismissVoicePromo(getDatabase());
            setSettings(await getUserSettings(getDatabase()));
          }}
          dismissLabel={t('home.voiceDismiss')}
        />
      ) : null}

      {/* US-047: only where the household's market actually sends money "back home" (US-013's
          Transferts slot), and only once Pro-entitled — a free household sees the Transferts tab's
          own upsell instead of a shortcut to a form it can't use. */}
      {entitlements.can('transfers') &&
      settings?.countryCode &&
      marketHasModule(settings.countryCode, 'transfers') ? (
        <Button
          label={t('home.transfersShortcut', { country: t(originMarket().nameKey) })}
          variant="secondary"
          icon="plane"
          onPress={() => navigation?.navigate('transfers', { openRecordForm: true })}
        />
      ) : null}

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

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader
          title={t('home.goalsTitle')}
          actionLabel={vaults.length > 0 ? t('home.seeAll') : undefined}
          onActionPress={() => setView('vaults')}
        />
        {vaults.length === 0 ? (
          // The section stays, with an invitation: hiding it entirely would leave a household
          // that has never saved with no way to discover goals at all (US-011).
          <Card elevated style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('home.goalsEmpty')}
            </Txt>
            <Button
              label={t('home.goalsEmptyCta')}
              variant="secondary"
              icon="piggy-bank"
              onPress={() => setView('vaults')}
            />
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
          >
            {vaults.slice(0, GOAL_PREVIEW_COUNT).map((vault, index) => {
              const status = computeVaultStatus(vault, contributionsUpToMonth);
              return (
                <GoalCard
                  key={vault.id}
                  icon="piggy-bank"
                  accent={GOAL_ACCENTS[index % GOAL_ACCENTS.length]}
                  title={vault.name}
                  progress={status.percentage === Infinity ? 1 : status.percentage / 100}
                  caption={`${num(status.savedMinor)} / ${num(vault.targetMinor)} ${vault.currencyCode}`}
                  onPress={() => setView('vaults')}
                  style={{ width: 160 }}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      <SectionHeader
        title={t('home.recentTitle')}
        actionLabel={recent.length > 0 ? t('home.seeAll') : undefined}
        onActionPress={() => setView('history')}
      />

      {recent.length === 0 && !hasEverRecorded ? (
        <Card
          elevated
          testID="first-run-empty-state"
          style={{ alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl }}
        >
          <Txt weight="semibold" size="md" style={{ textAlign: 'center' }}>
            {t('home.emptyState')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('home.emptyStateHint')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button label={t('home.emptyStateExpense')} icon="plus" onPress={() => openEntry()} />
            <Button
              label={t('home.emptyStateVoice')}
              icon="mic"
              variant="secondary"
              onPress={openVoiceEntry}
            />
          </View>
        </Card>
      ) : recent.length === 0 ? (
        <Card elevated style={{ paddingVertical: theme.spacing.lg }}>
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('home.monthEmpty')}
          </Txt>
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
