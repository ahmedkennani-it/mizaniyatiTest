import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Chip, Icon, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { listHouseholds } from '../db/repositories';
import type { Household } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput } from '../money';
import { useTheme } from '../theme';
import { createTontineGroupWithMembers } from '../tontine';

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
  const { language } = useLanguage();

  const [households, setHouseholds] = useState<Household[]>([]);
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

  useEffect(() => {
    listHouseholds(getDatabase()).then(setHouseholds);
  }, []);

  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

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

  function moveMember(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= memberNames.length) return;
    setMemberNames((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSelfIndex((current) => {
      if (current === index) return target;
      if (current === target) return index;
      return current;
    });
  }

  const validMemberCount = memberNames.filter((memberName) => memberName.trim()).length;
  const previewContributionMinor = parseAmountInput(contributionInput, currencyCode) ?? 0;
  const previewPotLabel = useMemo(
    () => formatMoney(previewContributionMinor * validMemberCount, currencyCode, language),
    [previewContributionMinor, validMemberCount, currencyCode, language],
  );

  async function handleSubmit() {
    const trimmedName = name.trim();
    const contributionPerRoundMinor = parseAmountInput(contributionInput, currencyCode);
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
    if (
      trimmedMemberNames.length < MIN_MEMBERS ||
      trimmedMemberNames.some((memberName) => !memberName)
    ) {
      nextErrors.members = t('tontineForm.errorMembers');
    }
    if (selfIndex === null || !trimmedMemberNames[selfIndex]) {
      nextErrors.self = t('tontineForm.errorSelf');
    }
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      contributionPerRoundMinor === null ||
      selfIndex === null
    ) {
      return;
    }

    await createTontineGroupWithMembers(getDatabase(), {
      name: trimmedName,
      contributionPerRoundMinor,
      currencyCode,
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
          {t('tontineForm.periodicityLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <Chip label={t('tontineForm.periodicityMonthly')} selected onPress={() => {}} />
        </View>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('tontineForm.periodicityWeeklyNote')}
        </Txt>
      </View>

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
              <View style={{ flexDirection: 'row' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('tontineForm.moveUp')}
                  accessibilityState={{ disabled: index === 0 }}
                  disabled={index === 0}
                  onPress={() => moveMember(index, -1)}
                  hitSlop={10}
                  style={{ padding: theme.spacing.xs }}
                >
                  <Icon
                    name="chevron-up"
                    size={20}
                    color={index === 0 ? theme.colors.textTertiary : theme.colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('tontineForm.moveDown')}
                  accessibilityState={{ disabled: index === memberNames.length - 1 }}
                  disabled={index === memberNames.length - 1}
                  onPress={() => moveMember(index, 1)}
                  hitSlop={10}
                  style={{ padding: theme.spacing.xs }}
                >
                  <Icon
                    name="chevron-down"
                    size={20}
                    color={
                      index === memberNames.length - 1
                        ? theme.colors.textTertiary
                        : theme.colors.textSecondary
                    }
                  />
                </Pressable>
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

      <Card elevated style={{ gap: theme.spacing.xs }}>
        <Txt weight="semibold" size="sm">
          {t('tontineForm.previewTitle')}
        </Txt>
        <Txt size="sm">{t('tontineForm.previewPotLabel', { amount: previewPotLabel })}</Txt>
        <Txt size="sm">{t('tontineForm.previewRoundsLabel', { count: validMemberCount })}</Txt>
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('tontineForm.submit')} onPress={handleSubmit} />
        <Button label={t('tontineForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>
    </AppScreen>
  );
}
