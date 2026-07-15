import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Chip, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { DEFAULT_CURRENCY_CODE, parseAmountInput } from '../money';
import { createTontineGroupWithMembers } from '../tontine';
import { useTheme } from '../theme';

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const MIN_MEMBERS = 2;

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface TontineGroupFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function TontineGroupForm({ onSaved, onCancel }: TontineGroupFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [contributionInput, setContributionInput] = useState('');
  const [startMonth, setStartMonth] = useState(currentMonthKey());
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);
  const [selfIndex, setSelfIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    contribution?: string;
    startMonth?: string;
    members?: string;
    self?: string;
  }>({});

  function updateMemberName(index: number, value: string) {
    setMemberNames((current) => current.map((existing, i) => (i === index ? value : existing)));
  }

  function addMember() {
    setMemberNames((current) => [...current, '']);
  }

  function removeMember(index: number) {
    setMemberNames((current) => current.filter((_, i) => i !== index));
    setSelfIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    const contributionPerRoundMinor = parseAmountInput(contributionInput, DEFAULT_CURRENCY_CODE);
    const trimmedMemberNames = memberNames.map((memberName) => memberName.trim());
    const nextErrors: typeof errors = {};

    if (!trimmedName) {
      nextErrors.name = t('tontineForm.errorName');
    }
    if (contributionPerRoundMinor === null) {
      nextErrors.contribution = t('tontineForm.errorContribution');
    }
    if (!MONTH_PATTERN.test(startMonth)) {
      nextErrors.startMonth = t('tontineForm.errorStartMonth');
    }
    if (trimmedMemberNames.length < MIN_MEMBERS || trimmedMemberNames.some((memberName) => !memberName)) {
      nextErrors.members = t('tontineForm.errorMembers');
    }
    if (selfIndex === null || !trimmedMemberNames[selfIndex]) {
      nextErrors.self = t('tontineForm.errorSelf');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || contributionPerRoundMinor === null || selfIndex === null) {
      return;
    }

    await createTontineGroupWithMembers(getDatabase(), {
      name: trimmedName,
      contributionPerRoundMinor,
      currencyCode: DEFAULT_CURRENCY_CODE,
      startMonth,
      memberNames: trimmedMemberNames,
      selfIndex,
    });
    onSaved();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('tontineForm.title')} onBack={onCancel} />

      <TextField
        label={t('tontineForm.nameLabel')}
        placeholder={t('tontineForm.namePlaceholder')}
        value={name}
        onChangeText={setName}
        errorMessage={errors.name}
      />

      <TextField
        label={t('tontineForm.contributionLabel')}
        placeholder={t('tontineForm.contributionPlaceholder')}
        value={contributionInput}
        onChangeText={setContributionInput}
        keyboardType="decimal-pad"
        errorMessage={errors.contribution}
      />

      <TextField
        label={t('tontineForm.startMonthLabel')}
        placeholder={t('tontineForm.startMonthPlaceholder')}
        value={startMonth}
        onChangeText={setStartMonth}
        errorMessage={errors.startMonth}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('tontineForm.membersLabel')}
        </Txt>
        {memberNames.map((memberName, index) => (
          <View key={index} style={{ gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('tontineForm.memberPlaceholder', { index: index + 1 })}
                  value={memberName}
                  onChangeText={(value) => updateMemberName(index, value)}
                />
              </View>
              {memberNames.length > MIN_MEMBERS ? (
                <Button
                  label={t('tontineForm.removeMember')}
                  variant="secondary"
                  onPress={() => removeMember(index)}
                />
              ) : null}
            </View>
            <Chip
              label={t('tontineForm.selfLabel')}
              selected={selfIndex === index}
              onPress={() => setSelfIndex(index)}
            />
          </View>
        ))}
        {errors.members ? (
          <Txt size="xs" color={theme.colors.danger}>
            {errors.members}
          </Txt>
        ) : null}
        {errors.self ? (
          <Txt size="xs" color={theme.colors.danger}>
            {errors.self}
          </Txt>
        ) : null}
        <Pressable accessibilityRole="button" onPress={addMember}>
          <Txt weight="bold" size="sm" color={theme.colors.primary}>
            {t('tontineForm.addMember')}
          </Txt>
        </Pressable>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('tontineForm.submit')} onPress={handleSubmit} />
        <Button label={t('tontineForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>
    </AppScreen>
  );
}
