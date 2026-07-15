import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Chip, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { createRecurringRule, deleteRecurringRule, listCategories, listMembers, updateRecurringRule } from '../db/repositories';
import type { Category, Member, RecurringFrequency, RecurringMode, RecurringRule, TransactionType } from '../db/repositories';
import { DEFAULT_CURRENCY_CODE, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const WEEKDAY_KEYS = [
  'weekdaySunday',
  'weekdayMonday',
  'weekdayTuesday',
  'weekdayWednesday',
  'weekdayThursday',
  'weekdayFriday',
  'weekdaySaturday',
] as const;

export interface RecurringRuleFormProps {
  /** When set, the form edits this rule instead of creating a new one. */
  rule?: RecurringRule;
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `rule` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function RecurringRuleForm({ rule, onSaved, onCancel, onDeleted }: RecurringRuleFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isEditing = rule !== undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [type, setType] = useState<TransactionType>(rule?.type ?? 'expense');
  const [amountInput, setAmountInput] = useState(
    rule ? String(toMajorUnits(rule.amountMinor, rule.currencyCode)) : '',
  );
  const [categoryId, setCategoryId] = useState<string | null>(rule?.categoryId ?? null);
  const [memberId, setMemberId] = useState<string | null>(rule?.memberId ?? null);
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule?.frequency ?? 'monthly');
  const [dayOfMonthInput, setDayOfMonthInput] = useState(
    rule?.dayOfMonth ? String(rule.dayOfMonth) : '1',
  );
  const [weekday, setWeekday] = useState(rule?.weekday ?? 0);
  const [startDateInput, setStartDateInput] = useState(rule?.startDate ?? todayIsoDate());
  const [endDateInput, setEndDateInput] = useState(rule?.endDate ?? '');
  const [mode, setMode] = useState<RecurringMode>(rule?.mode ?? 'prompt');
  const [paused, setPaused] = useState(rule?.paused ?? false);
  const [note, setNote] = useState(rule?.note ?? '');
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    member?: string;
    startDate?: string;
    endDate?: string;
    dayOfMonth?: string;
  }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    listCategories(db).then((loaded) => {
      setCategories(loaded);
      setCategoryId((current) => current ?? loaded[0]?.id ?? null);
    });
    listMembers(db).then((loaded) => {
      setMembers(loaded);
      setMemberId((current) => current ?? loaded[0]?.id ?? null);
    });
  }, []);

  async function handleSubmit() {
    const amountMinor = parseAmountInput(amountInput, DEFAULT_CURRENCY_CODE);
    const dayOfMonth = Number(dayOfMonthInput);
    const nextErrors: typeof errors = {};
    if (amountMinor === null) {
      nextErrors.amount = t('recurringForm.errorAmount');
    }
    if (!categoryId) {
      nextErrors.category = t('recurringForm.errorCategory');
    }
    if (!memberId) {
      nextErrors.member = t('recurringForm.errorMember');
    }
    if (!ISO_DATE_PATTERN.test(startDateInput)) {
      nextErrors.startDate = t('recurringForm.errorStartDate');
    }
    if (endDateInput && (!ISO_DATE_PATTERN.test(endDateInput) || endDateInput <= startDateInput)) {
      nextErrors.endDate = t('recurringForm.errorEndDate');
    }
    if (frequency === 'monthly' && (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)) {
      nextErrors.dayOfMonth = t('recurringForm.errorDayOfMonth');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !categoryId || !memberId) {
      return;
    }

    const input = {
      type,
      amountMinor,
      currencyCode: DEFAULT_CURRENCY_CODE,
      categoryId,
      memberId,
      frequency,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
      weekday: frequency === 'weekly' ? weekday : null,
      startDate: startDateInput,
      endDate: endDateInput || null,
      mode,
      paused,
      note: note.trim() || null,
    };

    if (isEditing && rule) {
      await updateRecurringRule(getDatabase(), rule.id, input);
    } else {
      await createRecurringRule(getDatabase(), input);
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!rule) {
      return;
    }
    await deleteRecurringRule(getDatabase(), rule.id);
    onDeleted?.();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={isEditing ? t('recurringForm.titleEdit') : t('recurringForm.titleNew')}
        onBack={onCancel}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('expenseForm.typeLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip label={t('expenseForm.typeExpense')} selected={type === 'expense'} onPress={() => setType('expense')} />
          <Chip label={t('expenseForm.typeIncome')} selected={type === 'income'} onPress={() => setType('income')} />
        </View>
      </View>

      <TextField
        label={t('recurringForm.amountLabel')}
        placeholder={t('recurringForm.amountPlaceholder')}
        value={amountInput}
        onChangeText={setAmountInput}
        keyboardType="decimal-pad"
        errorMessage={errors.amount}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('recurringForm.categoryLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
        {errors.category ? (
          <Txt size="xs" color={theme.colors.danger}>
            {errors.category}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('recurringForm.memberLabel')}
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

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('recurringForm.frequencyLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip
            label={t('recurringForm.frequencyMonthly')}
            selected={frequency === 'monthly'}
            onPress={() => setFrequency('monthly')}
          />
          <Chip
            label={t('recurringForm.frequencyWeekly')}
            selected={frequency === 'weekly'}
            onPress={() => setFrequency('weekly')}
          />
        </View>
      </View>

      {frequency === 'monthly' ? (
        <TextField
          label={t('recurringForm.dayOfMonthLabel')}
          placeholder={t('recurringForm.dayOfMonthPlaceholder')}
          value={dayOfMonthInput}
          onChangeText={setDayOfMonthInput}
          keyboardType="number-pad"
          errorMessage={errors.dayOfMonth}
        />
      ) : (
        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('recurringForm.weekdayLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {WEEKDAY_KEYS.map((key, index) => (
              <Chip
                key={key}
                label={t(`recurringForm.${key}`)}
                selected={weekday === index}
                onPress={() => setWeekday(index)}
              />
            ))}
          </View>
        </View>
      )}

      <TextField
        label={t('recurringForm.startDateLabel')}
        value={startDateInput}
        onChangeText={setStartDateInput}
        errorMessage={errors.startDate}
      />

      <TextField
        label={t('recurringForm.endDateLabel')}
        value={endDateInput}
        onChangeText={setEndDateInput}
        errorMessage={errors.endDate}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('recurringForm.modeLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip label={t('recurringForm.modePrompt')} selected={mode === 'prompt'} onPress={() => setMode('prompt')} />
          <Chip label={t('recurringForm.modeAuto')} selected={mode === 'auto'} onPress={() => setMode('auto')} />
        </View>
      </View>

      <TextField
        label={t('recurringForm.noteLabel')}
        placeholder={t('recurringForm.notePlaceholder')}
        value={note}
        onChangeText={setNote}
      />

      {isEditing ? (
        <Button
          label={paused ? t('recurringForm.resume') : t('recurringForm.pause')}
          variant={paused ? 'primary' : 'secondary'}
          onPress={() => setPaused((current) => !current)}
        />
      ) : null}

      <Card style={{ gap: theme.spacing.sm }}>
        <Button label={t('recurringForm.submit')} onPress={handleSubmit} />
        <Button label={t('recurringForm.cancel')} variant="secondary" onPress={onCancel} />
      </Card>

      {isEditing ? (
        <Card style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('recurringForm.deleteConfirmMessage')}</Txt>
              <Button label={t('recurringForm.deleteConfirmYes')} variant="danger" onPress={handleConfirmDelete} />
              <Button
                label={t('recurringForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button label={t('recurringForm.delete')} variant="danger" onPress={() => setConfirmingDelete(true)} />
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
