import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CountrySelectorScreen } from './CountrySelectorScreen';
import { DebtsScreen } from './DebtsScreen';
import { MembersScreen } from './MembersScreen';
import { PaywallScreen } from './PaywallScreen';
import { PlaceholderScreen } from './PlaceholderScreen';
import { RamadanScreen } from './RamadanScreen';
import { RecurringRulesScreen } from './RecurringRulesScreen';
import { SecurityScreen } from './SecurityScreen';
import { VaultsScreen } from './VaultsScreen';
import { ZakatScreen } from './ZakatScreen';
import {
  AppScreen,
  Avatar,
  Button,
  Card,
  Chip,
  ListRow,
  Pill,
  ScreenHeader,
  SectionHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  getNotificationSettings,
  getUserSettings,
  listHouseholds,
  listMembers,
  setBudgetAlertsEnabled,
} from '../db/repositories';
import type { Household, Member, UserSettings } from '../db/repositories';
import { PRO_PLAN, useEntitlements } from '../entitlements';
import { languageOption, nextLanguage, useLanguage } from '../i18n';
import { findMarket } from '../market';
import { DEFAULT_CURRENCY_CODE } from '../money';
import { useSubscription } from '../subscriptions';
import { useTheme } from '../theme';

/** How many avatars stack before folding the rest into a "+N" tail (US-053). */
const STACKED_AVATAR_LIMIT = 3;

/** Wraps `PlaceholderScreen` with a back link — for entry points to specs not built yet. */
function ProfilePlaceholder({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={title} onBack={onBack} />
      <PlaceholderScreen title={title} message={message} />
    </AppScreen>
  );
}

/**
 * Profile/settings tab (US-027). A profile hero card + sectioned setting groups: preferences
 * (language, seasonal theme), display (dark mode, senior mode), alerts, family, and account —
 * each row a shared `ListRow`, so the whole tab shares the design system's card/typography rhythm
 * and mirrors under RTL. Entry points open the corresponding spec screens in place.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const {
    theme,
    colorScheme,
    colorSchemePreference,
    setColorSchemePreference,
    seniorMode,
    toggleSeniorMode,
  } = useTheme();
  const { language, setLanguage } = useLanguage();
  const entitlements = useEntitlements();
  const { plan } = useSubscription();
  const isPro = plan.id === PRO_PLAN.id;

  const [budgetAlertsEnabled, setBudgetAlertsEnabledState] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [view, setView] = useState<
    | 'settings'
    | 'recurring'
    | 'vaults'
    | 'zakat'
    | 'ramadan'
    | 'members'
    | 'security'
    | 'subscription'
    | 'account'
    | 'debts'
    | 'country'
  >('settings');

  const refresh = useCallback(() => {
    const db = getDatabase();
    getNotificationSettings(db)
      .then((settings) => settings.budgetAlertsEnabled)
      .then(setBudgetAlertsEnabledState);
    listMembers(db).then(setMembers);
    listHouseholds(db).then(setHouseholds);
    getUserSettings(db).then(setSettings);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleBudgetAlerts() {
    const updated = await setBudgetAlertsEnabled(getDatabase(), !budgetAlertsEnabled);
    setBudgetAlertsEnabledState(updated.budgetAlertsEnabled);
  }

  if (view === 'recurring') return <RecurringRulesScreen onBack={() => setView('settings')} />;
  if (view === 'vaults') return <VaultsScreen onBack={() => setView('settings')} />;
  if (view === 'zakat') return <ZakatScreen onBack={() => setView('settings')} />;
  if (view === 'ramadan')
    return (
      <RamadanScreen
        onBack={() => setView('settings')}
        onNavigateToZakat={() => setView('zakat')}
      />
    );
  if (view === 'members') return <MembersScreen onBack={() => setView('settings')} />;
  if (view === 'debts') return <DebtsScreen onBack={() => setView('settings')} />;
  if (view === 'country') return <CountrySelectorScreen onBack={() => setView('settings')} />;
  if (view === 'security') return <SecurityScreen onBack={() => setView('settings')} />;
  if (view === 'subscription') return <PaywallScreen onBack={() => setView('settings')} />;
  if (view === 'account') {
    return (
      <ProfilePlaceholder
        title={t('accountScreen.title')}
        message={t('accountScreen.message')}
        onBack={() => setView('settings')}
      />
    );
  }

  // The household's own name, not its first member's (US-005's fix, revisited here — the profile
  // hero is a second place this same "membre confondu avec foyer" bug could have crept back in).
  const householdName = households[0]?.name ?? t('home.household');
  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;
  const countryName = settings?.countryCode ? findMarket(settings.countryCode)?.nameKey : undefined;
  const languageName = t(languageOption(language).translatedNameKey);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('nav.profile')} />

      {/* Profile hero */}
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar name={householdName} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <Txt weight="bold" size="md">
              {householdName}
            </Txt>
            {isPro ? (
              <Pill
                label={t('profileScreen.proBadge')}
                background={theme.accents.gold.wash}
                color={theme.accents.gold.ink}
              />
            ) : null}
          </View>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {countryName ? `${t(countryName)} · ${t('home.disclaimer')}` : t('home.disclaimer')}
          </Txt>
        </View>
        <Pill
          label={currencyCode}
          background={theme.accents.teal.wash}
          color={theme.accents.teal.ink}
        />
      </Card>

      {/* Preferences */}
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('language.label')} />
        <ListRow
          icon="globe"
          accent="teal"
          title={t('language.label')}
          value={languageName}
          onPress={() => setLanguage(nextLanguage(language))}
          chevron
        />
        <ListRow
          icon="map-pin"
          accent="blue"
          title={t('countrySelector.openLink')}
          value={currencyCode}
          onPress={() => setView('country')}
          chevron
        />
        <ListRow
          icon="moon-star"
          accent="gold"
          title={t('ramadanScreen.openLink')}
          onPress={() => setView('ramadan')}
          chevron
        />
      </View>

      {/* Display / accessibility */}
      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('theme.label', {
            scheme: colorScheme === 'light' ? t('theme.schemeLight') : t('theme.schemeDark'),
            senior: seniorMode ? t('theme.seniorSuffix') : '',
          })}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip
            label={t('theme.schemeLight')}
            selected={colorSchemePreference === 'light'}
            onPress={() => setColorSchemePreference('light')}
          />
          <Chip
            label={t('theme.schemeDark')}
            selected={colorSchemePreference === 'dark'}
            onPress={() => setColorSchemePreference('dark')}
          />
          <Chip
            label={t('theme.schemeSystem')}
            selected={colorSchemePreference === 'system'}
            onPress={() => setColorSchemePreference('system')}
          />
        </View>
        <Button
          label={seniorMode ? t('theme.disableSenior') : t('theme.enableSenior')}
          variant={seniorMode ? 'danger' : 'primary'}
          onPress={toggleSeniorMode}
        />
      </Card>

      {/* Alerts */}
      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('notifications.settingsTitle')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('notifications.settingsDescription')}
        </Txt>
        <Button
          label={budgetAlertsEnabled ? t('notifications.disable') : t('notifications.enable')}
          variant={budgetAlertsEnabled ? 'danger' : 'primary'}
          onPress={toggleBudgetAlerts}
        />
      </Card>

      {/* Family & features */}
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('membersScreen.openLink')} />
        <ListRow
          leading={
            <View style={{ flexDirection: 'row' }}>
              {members.slice(0, STACKED_AVATAR_LIMIT).map((member, index) => (
                <Avatar
                  key={member.id}
                  name={member.name}
                  size={32}
                  accent={index % 2 === 0 ? 'teal' : 'purple'}
                  style={{
                    marginStart: index === 0 ? 0 : -12,
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                  }}
                />
              ))}
            </View>
          }
          title={t('membersScreen.openLink')}
          subtitle={t('membersScreen.memberCountLabel', { count: members.length })}
          onPress={() => setView('members')}
          chevron
        />
        {members.length >= entitlements.limit('members.max') ? (
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t('membersScreen.familyPreviewUpsell')}
          </Txt>
        ) : null}
        <ListRow
          icon="calendar-clock"
          accent="blue"
          title={t('recurringRulesScreen.openLink')}
          onPress={() => setView('recurring')}
          chevron
        />
        <ListRow
          icon="piggy-bank"
          accent="purple"
          title={t('vaultsScreen.openLink')}
          onPress={() => setView('vaults')}
          chevron
        />
        <ListRow
          icon="hand-heart"
          accent="gold"
          title={t('zakatScreen.openLink')}
          onPress={() => setView('zakat')}
          chevron
        />
        <ListRow
          icon="handshake"
          accent="coral"
          title={t('debtsScreen.openLink')}
          onPress={() => setView('debts')}
          chevron
        />
      </View>

      {/* Account */}
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('accountScreen.openLink')} />
        <ListRow
          icon="lock"
          accent="teal"
          title={t('securityScreen.openLink')}
          onPress={() => setView('security')}
          chevron
        />
        <ListRow
          icon="tag"
          accent="purple"
          title={isPro ? t('subscriptionScreen.openLink') : t('subscriptionScreen.upgradeLink')}
          onPress={() => setView('subscription')}
          chevron
        />
        <ListRow
          icon="user"
          accent="blue"
          title={t('accountScreen.openLink')}
          onPress={() => setView('account')}
          chevron
        />
      </View>
    </AppScreen>
  );
}
