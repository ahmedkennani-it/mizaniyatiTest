import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MemberForm } from './MemberForm';
import {
  AppScreen,
  Avatar,
  Button,
  Card,
  Chip,
  ListRow,
  Pill,
  ScreenHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { listMembers, listTransactions } from '../db/repositories';
import type { Member, MemberRole, Transaction } from '../db/repositories';
import { useTheme } from '../theme';

export interface MembersScreenProps {
  onBack: () => void;
}

export function MembersScreen({ onBack }: MembersScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [view, setView] = useState<'list' | 'form' | 'invite'>('list');
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');

  const refresh = useCallback(() => {
    const db = getDatabase();
    listMembers(db).then(setMembers);
    listTransactions(db).then(setTransactions);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (view === 'form') {
    const otherMembers = editingMember
      ? members.filter((candidate) => candidate.id !== editingMember.id)
      : members;
    const transactionsToReassign = editingMember
      ? transactions.filter((transaction) => transaction.memberId === editingMember.id)
      : [];
    return (
      <MemberForm
        member={editingMember ?? undefined}
        otherMembers={otherMembers}
        transactionsToReassign={transactionsToReassign}
        onSaved={() => {
          refresh();
          setEditingMember(null);
          setView('list');
        }}
        onCancel={() => {
          setEditingMember(null);
          setView('list');
        }}
        onDeleted={() => {
          refresh();
          setEditingMember(null);
          setView('list');
        }}
      />
    );
  }

  if (view === 'invite') {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('memberInvite.title')} onBack={() => setView('list')} />

        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('memberInvite.roleLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Chip
              label={t('membersScreen.roleEditor')}
              selected={inviteRole === 'editor'}
              onPress={() => setInviteRole('editor')}
            />
            <Chip
              label={t('membersScreen.roleViewer')}
              selected={inviteRole === 'viewer'}
              onPress={() => setInviteRole('viewer')}
            />
          </View>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {inviteRole === 'editor'
              ? t('memberInvite.roleEditorHint')
              : t('memberInvite.roleViewerHint')}
          </Txt>
        </View>

        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt size="sm">{t('memberInvite.cloudRequiredMessage')}</Txt>
          <Button label={t('memberInvite.enableCloudButton')} disabled />
        </Card>

        <Button
          label={t('memberInvite.cancel')}
          variant="secondary"
          onPress={() => setView('list')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('membersScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('membersScreen.subtitle')}
      </Txt>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Button
          label={t('membersScreen.addButton')}
          style={{ flex: 1 }}
          onPress={() => {
            setEditingMember(null);
            setView('form');
          }}
        />
        <Button
          label={t('membersScreen.inviteButton')}
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setView('invite')}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {members.map((member, index) => (
          <ListRow
            key={member.id}
            leading={
              <Avatar name={member.name} size={40} accent={index % 2 === 0 ? 'teal' : 'purple'} />
            }
            title={member.name}
            trailing={
              <Pill
                label={
                  member.role === 'editor'
                    ? t('membersScreen.roleEditor')
                    : t('membersScreen.roleViewer')
                }
                background={theme.accents.teal.wash}
                color={theme.accents.teal.ink}
              />
            }
            onPress={() => {
              setEditingMember(member);
              setView('form');
            }}
          />
        ))}
      </View>
    </AppScreen>
  );
}
