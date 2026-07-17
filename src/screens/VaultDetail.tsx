import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VaultForm } from './VaultForm';
import {
  AppScreen,
  Button,
  Card,
  Chip,
  IconTile,
  Pill,
  ProgressBar,
  ScreenHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  createVaultContribution,
  deleteVaultContribution,
  getVaultById,
  listMembers,
  listVaultContributions,
} from '../db/repositories';
import type { Member, Vault, VaultContribution } from '../db/repositories';
import { useLanguage } from '../i18n';
import { formatShortDate } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeVaultStatus } from '../vaults';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface VaultDetailProps {
  vault: Vault;
  onBack: () => void;
  onVaultChanged: () => void;
  onVaultDeleted: () => void;
}

export function VaultDetail({ vault, onBack, onVaultChanged, onVaultDeleted }: VaultDetailProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [view, setView] = useState<'detail' | 'edit' | 'addContribution'>('detail');
  const [currentVault, setCurrentVault] = useState(vault);
  const [contributions, setContributions] = useState<VaultContribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(todayIsoDate());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; member?: string; date?: string }>({});

  const refresh = useCallback(() => {
    const db = getDatabase();
    listVaultContributions(db).then(setContributions);
    listMembers(db).then((loaded) => {
      setMembers(loaded);
      setMemberId((current) => current ?? loaded[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const num = (minor: number) =>
    forceLTR(toLocalizedDigits(toMajorUnits(minor, currentVault.currencyCode), language));

  const vaultContributions = contributions
    .filter((contribution) => contribution.vaultId === currentVault.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const status = computeVaultStatus(currentVault, contributions);
  const memberById = new Map(members.map((member) => [member.id, member] as const));

  if (view === 'edit') {
    return (
      <VaultForm
        vault={currentVault}
        savedMinor={status.savedMinor}
        onSaved={async () => {
          const updated = await getVaultById(getDatabase(), currentVault.id);
          if (updated) {
            setCurrentVault(updated);
          }
          setView('detail');
          onVaultChanged();
        }}
        onCancel={() => setView('detail')}
        onDeleted={onVaultDeleted}
      />
    );
  }

  async function handleAddContribution() {
    const amountMinor = parseAmountInput(amountInput, currentVault.currencyCode);
    const nextErrors: typeof errors = {};
    if (amountMinor === null) {
      nextErrors.amount = t('vaultDetail.errorContributionAmount');
    }
    if (!memberId) {
      nextErrors.member = t('vaultDetail.errorContributionMember');
    }
    if (!ISO_DATE_PATTERN.test(dateInput)) {
      nextErrors.date = t('vaultDetail.errorContributionDate');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !memberId) {
      return;
    }

    await createVaultContribution(getDatabase(), {
      vaultId: currentVault.id,
      amountMinor,
      memberId,
      date: new Date(dateInput).toISOString(),
      note: note.trim() || undefined,
    });
    setAmountInput('');
    setNote('');
    setView('detail');
    refresh();
  }

  async function handleDeleteContribution(id: string) {
    await deleteVaultContribution(getDatabase(), id);
    setConfirmingDeleteId(null);
    refresh();
  }

  if (view === 'addContribution') {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader
          title={t('vaultDetail.addContributionButton')}
          onBack={() => setView('detail')}
        />

        <TextField
          label={t('vaultDetail.contributionAmountLabel')}
          placeholder={t('vaultDetail.contributionAmountPlaceholder')}
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="decimal-pad"
          errorMessage={errors.amount}
        />

        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('vaultDetail.contributionMemberLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {members.map((member) => (
              <Chip
                key={member.id}
                label={member.name}
                selected={member.id === memberId}
                onPress={() => setMemberId(member.id)}
              />
            ))}
          </View>
          {errors.member ? (
            <Txt size="xs" color={theme.colors.danger}>
              {errors.member}
            </Txt>
          ) : null}
        </View>

        <TextField
          label={t('vaultDetail.contributionDateLabel')}
          value={dateInput}
          onChangeText={setDateInput}
          errorMessage={errors.date}
        />

        <TextField
          label={t('vaultDetail.contributionNoteLabel')}
          value={note}
          onChangeText={setNote}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('vaultDetail.contributionSubmit')} onPress={handleAddContribution} />
          <Button
            label={t('vaultDetail.contributionCancel')}
            variant="secondary"
            onPress={() => setView('detail')}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={currentVault.name} onBack={onBack} />

      <Card
        elevated
        style={{ gap: theme.spacing.sm, alignItems: 'center', paddingVertical: theme.spacing.lg }}
      >
        <IconTile icon="piggy-bank" accent="teal" size="lg" />
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('vaultDetail.savedLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.xs }}>
          <Txt weight="extrabold" size="xxl">
            {num(status.savedMinor)}
          </Txt>
          <Txt weight="semibold" size="sm" color={theme.colors.textSecondary}>
            {currentVault.currencyCode}
          </Txt>
        </View>
        <ProgressBar
          progress={status.percentage === Infinity ? 1 : status.percentage / 100}
          accent="teal"
          height={7}
          style={{ alignSelf: 'stretch' }}
        />
        <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
          {t('vaultsScreen.percentageLabel', {
            percentage: Math.round(Math.min(100, status.percentage)),
          })}
          {' · '}
          {t('vaultDetail.targetLabel')}:{' '}
          {formatMoney(status.targetMinor, currentVault.currencyCode, language)}
        </Txt>

        {status.isReached ? (
          <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
            <IconTile icon="party-popper" accent="gold" />
            <Txt weight="bold" color={theme.colors.success} style={{ textAlign: 'center' }}>
              {t('vaultDetail.reachedCelebration')}
              {status.surplusMinor > 0
                ? ` (+${formatMoney(status.surplusMinor, currentVault.currencyCode, language)})`
                : ''}
            </Txt>
          </View>
        ) : currentVault.deadline ? (
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Txt size="sm">
              {t('vaultDetail.remainingLabel')}:{' '}
              {formatMoney(status.remainingMinor, currentVault.currencyCode, language)}
            </Txt>
            {status.isOverdue ? (
              <>
                <Pill
                  label={t('vaultDetail.overdueBadge')}
                  background={theme.banner.warningBg}
                  color={theme.banner.warningText}
                />
                <Txt size="sm" color={theme.colors.danger}>
                  {t('vaultDetail.overdueHint')}
                </Txt>
              </>
            ) : null}
            {status.suggestedMonthlyMinor !== null ? (
              <Txt size="sm" color={theme.colors.textSecondary}>
                {t('vaultDetail.suggestedMonthlyLabel')}:{' '}
                {formatMoney(status.suggestedMonthlyMinor, currentVault.currencyCode, language)}
                {status.monthsRemaining !== null
                  ? ` (${t('vaultDetail.monthsRemainingLabel', { count: status.monthsRemaining })})`
                  : ''}
              </Txt>
            ) : null}
          </View>
        ) : (
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('vaultDetail.noDeadlineHint')}
          </Txt>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Button
          label={t('vaultDetail.addContributionButton')}
          style={{ flex: 1 }}
          onPress={() => setView('addContribution')}
        />
        <Button
          label={t('vaultDetail.editButton')}
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setView('edit')}
        />
      </View>

      <Txt weight="semibold" size="md">
        {t('vaultDetail.contributionsTitle')}
      </Txt>

      {vaultContributions.length === 0 ? (
        <Card elevated style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('vaultDetail.emptyContributions')}
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {vaultContributions.map((contribution) => (
            <Card key={contribution.id} elevated style={{ gap: theme.spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <IconTile icon="banknote" accent="teal" size="sm" />
                <View style={{ flex: 1, gap: 2 }}>
                  {contribution.note ? <Txt size="sm">{contribution.note}</Txt> : null}
                  <Txt size="xs" color={theme.colors.textSecondary}>
                    {[
                      formatShortDate(new Date(contribution.date), language),
                      memberById.get(contribution.memberId)?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Txt>
                </View>
                <Txt weight="bold" size="sm" color={theme.colors.success}>
                  {`+${formatMoney(contribution.amountMinor, currentVault.currencyCode, language)}`}
                </Txt>
              </View>
              {confirmingDeleteId === contribution.id ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <Txt size="xs">{t('vaultDetail.contributionDeleteConfirmMessage')}</Txt>
                  <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                    <Button
                      label={t('vaultDetail.contributionDeleteConfirmYes')}
                      variant="danger"
                      style={{ flex: 1 }}
                      onPress={() => handleDeleteContribution(contribution.id)}
                    />
                    <Button
                      label={t('vaultDetail.contributionDeleteConfirmCancel')}
                      variant="secondary"
                      style={{ flex: 1 }}
                      onPress={() => setConfirmingDeleteId(null)}
                    />
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmingDeleteId(contribution.id)}
                >
                  <Txt size="xs" color={theme.colors.danger}>
                    {t('vaultDetail.contributionDelete')}
                  </Txt>
                </Pressable>
              )}
            </Card>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
