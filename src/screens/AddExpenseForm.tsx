import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { computeCategoryBudgetStatus } from '../categories';
import { AppScreen, Button, Card, Chip, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import {
  listCategories,
  listMembers,
  listCategoryBudgets,
  listTransactions,
  getNotificationSettings,
  updateCategoryBudget,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../db/repositories';
import type { Category, Member, Transaction, TransactionType } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { notificationClient, shouldSendBudgetAlert } from '../notifications';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface AddExpenseFormProps {
  /** When set, the form edits this transaction instead of creating a new one. */
  transaction?: Transaction;
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `transaction` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function AddExpenseForm({ transaction, onSaved, onCancel, onDeleted }: AddExpenseFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEditing = transaction !== undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amountInput, setAmountInput] = useState(
    transaction ? String(toMajorUnits(transaction.amountMinor, transaction.currencyCode)) : '',
  );
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [memberId, setMemberId] = useState<string | null>(transaction?.memberId ?? null);
  const [dateInput, setDateInput] = useState(transaction?.occurredAt.slice(0, 10) ?? todayIsoDate());
  const [note, setNote] = useState(transaction?.note ?? '');
  const [errors, setErrors] = useState<{ amount?: string; category?: string; member?: string; date?: string }>(
    {},
  );
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

  /**
   * "Notification (opt-in) quand le cumul atteint le seuil" (US-019) — checked after every saved
   * **expense**. `shouldSendBudgetAlert` also gates on quiet hours and "already alerted this
   * month" (`CategoryBudget.lastAlertedMonth`), so this is safe to call on every save without
   * spamming a repeat notification once the threshold has already been crossed for the month.
   */
  async function maybeSendBudgetAlert(savedCategoryId: string) {
    const db = getDatabase();
    const budget = (await listCategoryBudgets(db)).find((candidate) => candidate.categoryId === savedCategoryId);
    if (!budget) {
      return;
    }
    const monthKey = currentMonthKey();
    const [settings, transactionsThisMonth] = await Promise.all([
      getNotificationSettings(db),
      listTransactions(db),
    ]);
    const budgetStatus = computeCategoryBudgetStatus(transactionsThisMonth, budget, monthKey);
    const decision = shouldSendBudgetAlert({
      enabled: settings.budgetAlertsEnabled,
      now: new Date(),
      budgetStatus,
      alreadyAlertedThisMonth: budget.lastAlertedMonth === monthKey,
    });
    if (!decision) {
      return;
    }
    const category = categories.find((candidate) => candidate.id === savedCategoryId);
    await notificationClient.presentNow({
      title: t('notifications.budgetAlertTitle'),
      body: t('notifications.budgetAlertBody', {
        category: category?.name ?? '',
        amount: formatMoney(budgetStatus.spentMinor, DEFAULT_CURRENCY_CODE, language),
      }),
    });
    await updateCategoryBudget(db, budget.id, { lastAlertedMonth: monthKey });
  }

  async function handleSubmit() {
    const amountMinor = parseAmountInput(amountInput, DEFAULT_CURRENCY_CODE);
    const nextErrors: typeof errors = {};
    if (amountMinor === null) {
      nextErrors.amount = t('expenseForm.errorAmount');
    }
    if (!categoryId) {
      nextErrors.category = t('expenseForm.errorCategory');
    }
    if (!memberId) {
      nextErrors.member = t('expenseForm.errorMember');
    }
    if (!ISO_DATE_PATTERN.test(dateInput)) {
      nextErrors.date = t('expenseForm.errorDate');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null || !categoryId || !memberId) {
      return;
    }

    const occurredAt = new Date(dateInput).toISOString();
    const trimmedNote = note.trim() || undefined;
    if (isEditing && transaction) {
      await updateTransaction(getDatabase(), transaction.id, {
        type,
        amountMinor,
        currencyCode: DEFAULT_CURRENCY_CODE,
        categoryId,
        memberId,
        occurredAt,
        note: trimmedNote ?? null,
      });
    } else {
      await createTransaction(getDatabase(), {
        type,
        amountMinor,
        currencyCode: DEFAULT_CURRENCY_CODE,
        categoryId,
        memberId,
        occurredAt,
        note: trimmedNote,
      });
    }
    if (type === 'expense') {
      await maybeSendBudgetAlert(categoryId);
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!transaction) {
      return;
    }
    await deleteTransaction(getDatabase(), transaction.id);
    onDeleted?.();
  }

  const title = isEditing
    ? type === 'income'
      ? t('expenseForm.titleEditIncome')
      : t('expenseForm.titleEditExpense')
    : type === 'income'
      ? t('expenseForm.titleIncome')
      : t('expenseForm.titleExpense');

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={title} onBack={onCancel} />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('expenseForm.typeLabel')}
        </Txt>
        <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
          <Chip label={t('expenseForm.typeExpense')} selected={type === 'expense'} onPress={() => setType('expense')} />
          <Chip label={t('expenseForm.typeIncome')} selected={type === 'income'} onPress={() => setType('income')} />
        </View>
      </View>

      <TextField
        label={t('expenseForm.amountLabel')}
        placeholder={t('expenseForm.amountPlaceholder')}
        value={amountInput}
        onChangeText={setAmountInput}
        keyboardType="decimal-pad"
        errorMessage={errors.amount}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('expenseForm.categoryLabel')}
        </Txt>
        <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
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
          {t('expenseForm.memberLabel')}
        </Txt>
        <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
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
        label={t('expenseForm.dateLabel')}
        value={dateInput}
        onChangeText={setDateInput}
        errorMessage={errors.date}
      />

      <TextField
        label={t('expenseForm.notePlaceholder')}
        placeholder={t('expenseForm.notePlaceholder')}
        value={note}
        onChangeText={setNote}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('expenseForm.submit')} onPress={handleSubmit} />
        <Button label={t('expenseForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('expenseForm.deleteConfirmMessage')}</Txt>
              <Button label={t('expenseForm.deleteConfirmYes')} variant="danger" onPress={handleConfirmDelete} />
              <Button
                label={t('expenseForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button label={t('expenseForm.delete')} variant="danger" onPress={() => setConfirmingDelete(true)} />
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
