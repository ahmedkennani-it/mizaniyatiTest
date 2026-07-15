import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  ListRow,
  Pill,
  ScreenHeader,
  SectionHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { getNotificationSettings, listMembers, setBudgetAlertsEnabled } from '../db/repositories';
import type { Member } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE } from '../money';
import { useTheme } from '../theme';

/** Wraps `PlaceholderScreen` with a back link — for entry points to specs not built yet. */
function ProfilePlaceholder({ title, message, onBack }: { title: string; message: string; onBack: () => void }) {
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
  const { theme, colorScheme, seniorMode, toggleColorScheme, toggleSeniorMode } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [budgetAlertsEnabled, setBudgetAlertsEnabledState] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [view, setView] = useState<
    'settings' | 'recurring' | 'vaults' | 'zakat' | 'ramadan' | 'members' | 'security' | 'subscription' | 'account'
  >('settings');

  const refresh = useCallback(() => {
    const db = getDatabase();
    getNotificationSettings(db)
      .then((settings) => settings.budgetAlertsEnabled)
      .then(setBudgetAlertsEnabledState);
    listMembers(db).then(setMembers);
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
    return <RamadanScreen onBack={() => setView('settings')} onNavigateToZakat={() => setView('zakat')} />;
  if (view === 'members') return <MembersScreen onBack={() => setView('settings')} />;
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

  const householdName = members[0]?.name ?? t('home.household');
  const languageName = language === 'fr' ? t('language.french') : t('language.arabic');

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('nav.profile')} />

      {/* Profile hero */}
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar name={householdName} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="bold" size="md">
            {householdName}
          </Txt>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {`${t('home.disclaimer')}`}
          </Txt>
        </View>
        <Pill label={DEFAULT_CURRENCY_CODE} background={theme.accents.teal.wash} color={theme.accents.teal.ink} />
      </Card>

      {/* Preferences */}
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('language.label')} />
        <ListRow
          icon="globe"
          accent="teal"
          title={t('language.label')}
          value={languageName}
          onPress={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
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
        <Button
          label={colorScheme === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}
          variant="secondary"
          onPress={toggleColorScheme}
        />
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
        <ListRow icon="users" accent="teal" title={t('membersScreen.openLink')} onPress={() => setView('members')} chevron />
        <ListRow icon="calendar-clock" accent="blue" title={t('recurringRulesScreen.openLink')} onPress={() => setView('recurring')} chevron />
        <ListRow icon="piggy-bank" accent="purple" title={t('vaultsScreen.openLink')} onPress={() => setView('vaults')} chevron />
        <ListRow icon="hand-heart" accent="gold" title={t('zakatScreen.openLink')} onPress={() => setView('zakat')} chevron />
      </View>

      {/* Account */}
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('accountScreen.openLink')} />
        <ListRow icon="lock" accent="teal" title={t('securityScreen.openLink')} onPress={() => setView('security')} chevron />
        <ListRow icon="tag" accent="purple" title={t('subscriptionScreen.openLink')} onPress={() => setView('subscription')} chevron />
        <ListRow icon="user" accent="blue" title={t('accountScreen.openLink')} onPress={() => setView('account')} chevron />
      </View>
    </AppScreen>
  );
}
