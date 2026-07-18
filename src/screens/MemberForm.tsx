import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Chip, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import {
  createMember,
  deleteMember,
  removeMember,
  updateMember,
  updateTransaction,
} from '../db/repositories';
import type { Member, MemberRole, Transaction } from '../db/repositories';
import { useTheme } from '../theme';

export interface MemberFormProps {
  /** When set, the form edits this member instead of creating a new one. */
  member?: Member;
  /** All other members (excluding `member`) — used as reassignment targets on delete. */
  otherMembers: Member[];
  /** Transactions currently filed under `member` — empty when creating or when none exist. */
  transactionsToReassign: Transaction[];
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `member` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function MemberForm({
  member,
  otherMembers,
  transactionsToReassign,
  onSaved,
  onCancel,
  onDeleted,
}: MemberFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isEditing = member !== undefined;

  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<MemberRole>(member?.role ?? 'editor');
  const [errorName, setErrorName] = useState<string | undefined>(undefined);

  const [confirmingAction, setConfirmingAction] = useState<'none' | 'remove' | 'delete'>('none');
  const [reassignToMemberId, setReassignToMemberId] = useState<string | null>(
    otherMembers[0]?.id ?? null,
  );

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorName(t('memberForm.errorName'));
      return;
    }
    setErrorName(undefined);

    if (isEditing && member) {
      await updateMember(getDatabase(), member.id, { name: trimmedName, role });
    } else {
      await createMember(getDatabase(), { name: trimmedName, role });
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!member) {
      return;
    }
    const db = getDatabase();
    if (transactionsToReassign.length > 0 && reassignToMemberId) {
      for (const transaction of transactionsToReassign) {
        await updateTransaction(db, transaction.id, { memberId: reassignToMemberId });
      }
    }
    await deleteMember(db, member.id);
    onDeleted?.();
  }

  /**
   * "Retirer du foyer" (US-052) — soft delete: unlike `handleConfirmDelete`, this never reassigns
   * or touches `transactionsToReassign` — they stay attributed to `member`, which just falls out
   * of the active member list (`Member.removedAt`).
   */
  async function handleConfirmRemove() {
    if (!member) {
      return;
    }
    await removeMember(getDatabase(), member.id);
    onDeleted?.();
  }

  const isLastMember = isEditing && otherMembers.length === 0;

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={isEditing ? t('memberForm.titleEdit') : t('memberForm.titleNew')}
        onBack={onCancel}
      />

      <TextField
        label={t('memberForm.nameLabel')}
        placeholder={t('memberForm.namePlaceholder')}
        value={name}
        onChangeText={setName}
        errorMessage={errorName}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('memberForm.roleLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip
            label={t('membersScreen.roleEditor')}
            selected={role === 'editor'}
            onPress={() => setRole('editor')}
          />
          <Chip
            label={t('membersScreen.roleViewer')}
            selected={role === 'viewer'}
            onPress={() => setRole('viewer')}
          />
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('memberForm.submit')} onPress={handleSubmit} />
        <Button label={t('memberForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {isLastMember ? (
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('memberForm.deleteBlockedLastMember')}
            </Txt>
          ) : confirmingAction === 'remove' ? (
            <>
              <Txt size="sm">
                {t('memberForm.removeConfirmMessage', { count: transactionsToReassign.length })}
              </Txt>
              <Button
                label={t('memberForm.removeConfirmYes')}
                variant="danger"
                onPress={handleConfirmRemove}
              />
              <Button
                label={t('memberForm.removeConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingAction('none')}
              />
            </>
          ) : confirmingAction === 'delete' ? (
            <>
              {transactionsToReassign.length > 0 ? (
                <>
                  <Txt size="sm">
                    {t('memberForm.deleteReassignMessage', {
                      count: transactionsToReassign.length,
                    })}
                  </Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                    {otherMembers.map((candidate) => (
                      <Chip
                        key={candidate.id}
                        label={candidate.name}
                        selected={candidate.id === reassignToMemberId}
                        onPress={() => setReassignToMemberId(candidate.id)}
                      />
                    ))}
                  </View>
                  <Button
                    label={t('memberForm.deleteReassignConfirm')}
                    variant="danger"
                    onPress={handleConfirmDelete}
                    disabled={!reassignToMemberId}
                  />
                </>
              ) : (
                <>
                  <Txt size="sm">{t('memberForm.deleteConfirmMessage')}</Txt>
                  <Button
                    label={t('memberForm.deleteConfirmYes')}
                    variant="danger"
                    onPress={handleConfirmDelete}
                  />
                </>
              )}
              <Button
                label={t('memberForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingAction('none')}
              />
            </>
          ) : (
            <>
              {transactionsToReassign.length > 0 ? (
                <Button
                  label={t('memberForm.removeFromHousehold')}
                  variant="danger"
                  onPress={() => setConfirmingAction('remove')}
                />
              ) : null}
              <Button
                label={t('memberForm.delete')}
                variant={transactionsToReassign.length > 0 ? 'secondary' : 'danger'}
                onPress={() => setConfirmingAction('delete')}
              />
            </>
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
