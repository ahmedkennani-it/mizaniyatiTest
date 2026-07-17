import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TontineGroupForm } from './TontineGroupForm';
import {
  AppScreen,
  AlertBanner,
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
import {
  listTontineGroups,
  listTontineMembers,
  listTontinePayments,
  listTontineRounds,
  updateTontineGroup,
  updateTontinePayment,
} from '../db/repositories';
import type { TontineGroup, TontineMember, TontinePayment, TontineRound } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { formatMonthLabel } from '../i18n/dateFormat';
import { formatMoney } from '../money';
import { useTheme } from '../theme';
import { computeRoundStatus, findCurrentRound, findMyRound, monthsUntil } from '../tontine';

export function TontineScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [view, setView] = useState<'main' | 'form'>('main');
  const [groups, setGroups] = useState<TontineGroup[]>([]);
  const [members, setMembers] = useState<TontineMember[]>([]);
  const [rounds, setRounds] = useState<TontineRound[]>([]);
  const [payments, setPayments] = useState<TontinePayment[]>([]);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listTontineGroups(db).then(setGroups);
    listTontineMembers(db).then(setMembers);
    listTontineRounds(db).then(setRounds);
    listTontinePayments(db).then(setPayments);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entitlements.can('tontine')) {
    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('tontineScreen.title')} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('tontineScreen.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('tontineScreen.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  if (view === 'form') {
    return (
      <TontineGroupForm
        onSaved={() => {
          refresh();
          setView('main');
        }}
        onCancel={() => setView('main')}
      />
    );
  }

  const group = groups[0] ?? null;
  const groupMembers = group ? members.filter((member) => member.groupId === group.id) : [];
  const groupRounds = group ? rounds.filter((round) => round.groupId === group.id) : [];
  const groupPayments = group
    ? payments.filter((payment) => groupRounds.some((round) => round.id === payment.roundId))
    : [];

  async function togglePayment(payment: TontinePayment) {
    const nextStatus = payment.status === 'paid' ? 'pending' : 'paid';
    await updateTontinePayment(getDatabase(), payment.id, {
      status: nextStatus,
      paidAt: nextStatus === 'paid' ? new Date().toISOString() : null,
    });
    refresh();
  }

  async function toggleReminder() {
    if (!group) return;
    await updateTontineGroup(getDatabase(), group.id, { reminderEnabled: !group.reminderEnabled });
    refresh();
  }

  if (!group) {
    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('tontineScreen.title')} />
        <AlertBanner tone="info" icon="shield-check" message={t('tontineScreen.disclaimer')} />
        <Card
          elevated
          style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl }}
        >
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('tontineScreen.emptyState')}
          </Txt>
          <Button label={t('tontineScreen.createButton')} onPress={() => setView('form')} />
        </Card>
      </AppScreen>
    );
  }

  const now = new Date();
  const currentRound = findCurrentRound(groupRounds, now);
  const roundStatus = currentRound
    ? computeRoundStatus(currentRound, groupPayments, groupMembers)
    : null;
  const myRound = findMyRound(groupRounds, groupMembers);
  const myMonthsUntil = myRound ? monthsUntil(now, myRound.month) : null;
  const isMyRoundActionable = myRound !== null && myMonthsUntil !== null && myMonthsUntil >= 0;
  const potLabel = formatMoney(
    group.contributionPerRoundMinor * groupMembers.length,
    group.currencyCode,
    language,
  );

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={group.name} />

      <AlertBanner tone="info" icon="shield-check" message={t('tontineScreen.disclaimer')} />

      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('tontineScreen.memberCountLabel', { count: groupMembers.length })}
      </Txt>

      <Card
        elevated
        style={
          isMyRoundActionable
            ? {
                gap: theme.spacing.sm,
                backgroundColor: theme.accents.teal.wash,
                borderColor: theme.accents.teal.ink,
              }
            : { gap: theme.spacing.sm }
        }
      >
        <Txt weight="semibold" size="md">
          {t('tontineScreen.myRoundTitle')}
        </Txt>
        {myRound && myMonthsUntil !== null ? (
          <Txt size="sm">
            {myMonthsUntil > 0
              ? t('tontineScreen.myRoundUpcoming', {
                  round: myRound.roundNumber,
                  month: formatMonthLabel(myRound.month, language),
                  amount: potLabel,
                })
              : myMonthsUntil === 0
                ? t('tontineScreen.myRoundCurrent', {
                    round: myRound.roundNumber,
                    amount: potLabel,
                  })
                : t('tontineScreen.myRoundPast', {
                    round: myRound.roundNumber,
                    month: formatMonthLabel(myRound.month, language),
                    amount: potLabel,
                  })}
          </Txt>
        ) : (
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('tontineScreen.myRoundNone')}
          </Txt>
        )}
      </Card>

      {roundStatus ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Txt weight="semibold" size="md">
              {t('tontineScreen.currentRoundTitle')}
            </Txt>
            <Pill
              label={t('tontineScreen.paidCountLabel', {
                paid: roundStatus.paidCount,
                total: roundStatus.totalCount,
              })}
              background={theme.accents.teal.wash}
              color={theme.accents.teal.ink}
            />
          </View>
          <Txt weight="bold" size="sm">
            {t('tontineScreen.roundLabelWithMonth', {
              current: roundStatus.round.roundNumber,
              total: groupRounds.length,
              month: formatMonthLabel(roundStatus.round.month, language),
            })}
          </Txt>
          <Txt size="sm">
            {t('tontineScreen.potLabel')}: {potLabel}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('tontineScreen.beneficiaryLabel', { name: roundStatus.beneficiary?.name ?? '' })}
          </Txt>

          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
            {roundStatus.memberStatuses.map(({ member, payment }) => {
              const isPaid = payment?.status === 'paid';
              return (
                <ListRow
                  key={member.id}
                  leading={
                    <Avatar
                      name={member.name}
                      size={38}
                      accent={member.isSelf ? 'teal' : 'purple'}
                    />
                  }
                  title={`${member.name}${member.isSelf ? t('tontineScreen.calendarMineTag') : ''}`}
                  trailing={
                    <Txt
                      weight="bold"
                      size="sm"
                      color={isPaid ? theme.colors.success : theme.colors.primary}
                    >
                      {isPaid ? t('tontineScreen.markPending') : t('tontineScreen.markPaid')}
                    </Txt>
                  }
                  onPress={() => payment && togglePayment(payment)}
                />
              );
            })}
          </View>
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('tontineScreen.calendarTitle')} />
        {groupRounds.map((round) => {
          const beneficiary = groupMembers.find(
            (member) => member.id === round.beneficiaryMemberId,
          );
          const isCurrent = round.id === currentRound?.id;
          return (
            <ListRow
              key={round.id}
              icon={isCurrent ? 'handshake' : 'users'}
              accent={isCurrent ? 'teal' : 'purple'}
              title={t('tontineScreen.roundLabelWithMonth', {
                current: round.roundNumber,
                total: groupRounds.length,
                month: formatMonthLabel(round.month, language),
              })}
              subtitle={`${beneficiary?.name ?? ''}${beneficiary?.isSelf ? t('tontineScreen.calendarMineTag') : ''}`}
            />
          );
        })}
      </View>

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('tontineScreen.reminderTitle')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('tontineScreen.reminderDescription')}
        </Txt>
        <Button
          label={
            group.reminderEnabled
              ? t('tontineScreen.reminderDisable')
              : t('tontineScreen.reminderEnable')
          }
          variant={group.reminderEnabled ? 'danger' : 'primary'}
          onPress={toggleReminder}
        />
      </Card>
    </AppScreen>
  );
}
