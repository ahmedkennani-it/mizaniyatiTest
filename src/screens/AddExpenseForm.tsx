import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { categoryIconName, computeCategoryBudgetStatus, rankCategoriesByFrequency } from '../categories';
import {
  AppScreen,
  Button,
  Card,
  CategoryChipV,
  Chip,
  NumericKeypad,
  ScreenHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  listCategories,
  listHouseholds,
  listMembers,
  listCategoryBudgets,
  listTransactions,
  getNotificationSettings,
  updateCategoryBudget,
  createTransaction,
  createRecurringRule,
  updateTransaction,
  deleteTransaction,
} from '../db/repositories';
import type {
  Category,
  Household,
  Member,
  Transaction,
  TransactionType,
} from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { notificationClient, shouldSendBudgetAlert } from '../notifications';
import { nextMonthStart } from '../recurring';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * How many frequency-ranked chips the strip offers before "Plus" (US-017). Kept small on purpose:
 * the strip exists so the common case is one tap without reading, which stops being true once it
 * holds more names than can be recognised at a glance. Everything else is one tap away behind
 * "Plus".
 */
const QUICK_CATEGORY_COUNT = 6;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Pre-fills a *new* entry from a source that already understood part of it (US-021a: a voice
 *  dictation whose amount and/or wording were extracted before the household ever sees the form). */
export interface AddExpenseFormPrefill {
  amountInput?: string;
  note?: string;
  categoryId?: string;
}

export interface AddExpenseFormProps {
  /** When set, the form edits this transaction instead of creating a new one. */
  transaction?: Transaction;
  /** Ignored when `transaction` is set — editing always starts from the saved values. */
  prefill?: AddExpenseFormPrefill;
  /** The saved transaction, for a *new* entry (US-022's confirmation needs it) — omitted when
   *  editing, since editing closes straight back without a confirmation screen. */
  onSaved: (created?: Transaction) => void;
  onCancel: () => void;
  /** Required when `transaction` is set — called with the now-deleted transaction, so the caller
   *  can offer to restore it (US-024's 5s "Annuler" window). */
  onDeleted?: (deleted: Transaction) => void;
}

export function AddExpenseForm({
  transaction,
  prefill,
  onSaved,
  onCancel,
  onDeleted,
}: AddExpenseFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEditing = transaction !== undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  // US-023: only offered for a brand-new income — an edited transaction already happened, and a
  // recurring rule is its own standing thing afterwards (`RecurringRulesScreen`), not something an
  // edit should spawn a second one of.
  const [markAsMonthly, setMarkAsMonthly] = useState(false);
  const [amountInput, setAmountInput] = useState(
    transaction
      ? String(toMajorUnits(transaction.amountMinor, transaction.currencyCode))
      : (prefill?.amountInput ?? ''),
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction?.categoryId ?? prefill?.categoryId ?? null,
  );
  const [memberId, setMemberId] = useState<string | null>(transaction?.memberId ?? null);
  const [dateInput, setDateInput] = useState(
    transaction?.occurredAt.slice(0, 10) ?? todayIsoDate(),
  );
  const [note, setNote] = useState(transaction?.note ?? prefill?.note ?? '');
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    member?: string;
    date?: string;
  }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // An edited transaction keeps the currency it was recorded in; a new one takes the household's.
  const currencyCode =
    transaction?.currencyCode ?? households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  /**
   * US-016: Save is disabled at zero rather than erroring after the fact. `parseAmountInput`
   * already rejects zero, empty and non-numeric input, so this is the same rule the submit uses —
   * asked before the press instead of after it.
   */
  const hasUsableAmount = parseAmountInput(amountInput, currencyCode) !== null;

  useEffect(() => {
    const db = getDatabase();
    listHouseholds(db).then(setHouseholds);
    listCategories(db).then((loaded) => {
      setCategories(loaded);
      setCategoryId((current) => current ?? loaded[0]?.id ?? null);
    });
    listTransactions(db).then(setHistory);
    listMembers(db).then((loaded) => {
      setMembers(loaded);
      setMemberId((current) => current ?? loaded[0]?.id ?? null);
    });
  }, []);

  /**
   * Ranked once per load rather than per render: the order must not shift under the user's thumb
   * while the form is open, and nothing they do here changes the 30-day history until they save.
   */
  const rankedCategories = useMemo(
    () => rankCategoriesByFrequency(categories, history, new Date()),
    [categories, history],
  );

  /**
   * The strip always shows the selected category, pinned first when frequency alone wouldn't have
   * surfaced it — otherwise picking a rare category through "Plus" would collapse the strip back to
   * chips that all look unselected, with the actual choice nowhere on screen.
   */
  const quickCategories = useMemo(() => {
    const top = rankedCategories.slice(0, QUICK_CATEGORY_COUNT);
    if (!categoryId || top.some((category) => category.id === categoryId)) {
      return top;
    }
    const selected = rankedCategories.find((category) => category.id === categoryId);
    return selected ? [selected, ...top.slice(0, QUICK_CATEGORY_COUNT - 1)] : top;
  }, [rankedCategories, categoryId]);

  /**
   * "Notification (opt-in) quand le cumul atteint le seuil" (US-019) — checked after every saved
   * **expense**. `shouldSendBudgetAlert` also gates on quiet hours and "already alerted this
   * month" (`CategoryBudget.lastAlertedMonth`), so this is safe to call on every save without
   * spamming a repeat notification once the threshold has already been crossed for the month.
   */
  async function maybeSendBudgetAlert(savedCategoryId: string) {
    const db = getDatabase();
    const budget = (await listCategoryBudgets(db)).find(
      (candidate) => candidate.categoryId === savedCategoryId,
    );
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
        amount: formatMoney(budgetStatus.spentMinor, currencyCode, language),
      }),
    });
    await updateCategoryBudget(db, budget.id, { lastAlertedMonth: monthKey });
  }

  async function handleSubmit() {
    const amountMinor = parseAmountInput(amountInput, currencyCode);
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
    let created: Transaction | undefined;
    if (isEditing && transaction) {
      await updateTransaction(getDatabase(), transaction.id, {
        type,
        amountMinor,
        currencyCode,
        categoryId,
        memberId,
        occurredAt,
        note: trimmedNote ?? null,
      });
    } else {
      created = await createTransaction(getDatabase(), {
        type,
        amountMinor,
        currencyCode,
        categoryId,
        memberId,
        occurredAt,
        note: trimmedNote,
      });
      if (type === 'income' && markAsMonthly) {
        // Starts next month, not this one: this transaction already covers the month it was
        // entered in, so proposing it again immediately would be a duplicate, not a reminder.
        await createRecurringRule(getDatabase(), {
          type: 'income',
          amountMinor,
          currencyCode,
          categoryId,
          memberId,
          frequency: 'monthly',
          dayOfMonth: Number(dateInput.slice(8, 10)),
          startDate: nextMonthStart(dateInput),
          mode: 'prompt',
          note: trimmedNote ?? null,
        });
      }
    }
    if (type === 'expense') {
      await maybeSendBudgetAlert(categoryId);
    }
    onSaved(created);
  }

  async function handleConfirmDelete() {
    if (!transaction) {
      return;
    }
    await deleteTransaction(getDatabase(), transaction.id);
    onDeleted?.(transaction);
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
          <Chip
            label={t('expenseForm.typeExpense')}
            selected={type === 'expense'}
            onPress={() => setType('expense')}
          />
          <Chip
            label={t('expenseForm.typeIncome')}
            selected={type === 'income'}
            onPress={() => setType('income')}
          />
        </View>
        {type === 'income' && !isEditing ? (
          <View style={[styles.chipRow, { gap: theme.spacing.xs, alignItems: 'center' }]}>
            <Chip
              label={t('expenseForm.markAsMonthly')}
              selected={markAsMonthly}
              onPress={() => setMarkAsMonthly((previous) => !previous)}
            />
            {markAsMonthly ? (
              <Txt size="xs" color={theme.colors.textSecondary}>
                {t('expenseForm.markAsMonthlyHint')}
              </Txt>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <TextField
          label={t('expenseForm.amountLabelWithCurrency', { currency: currencyCode })}
          placeholder={t('expenseForm.amountPlaceholder')}
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="decimal-pad"
          autoFocus
          errorMessage={errors.amount}
        />
        {/* The keypad is the intended input; the field above stays editable so a hardware
            keyboard, a paste, or a screen reader's own input still work. */}
        <NumericKeypad
          value={amountInput}
          onChange={(next: string) => {
            setAmountInput(next);
            setErrors((previous) => ({ ...previous, amount: undefined }));
          }}
          currencyCode={currencyCode}
        />
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('expenseForm.categoryLabel')}
        </Txt>
        {showAllCategories ? (
          <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
            {rankedCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={category.id === categoryId}
                onPress={() => {
                  // Picking closes the list back onto the strip, where the choice shows up pinned:
                  // "Plus" is a detour to reach a rare category, not a mode to be dismissed by
                  // hand, and there is no other way back once it is open.
                  setCategoryId(category.id);
                  setShowAllCategories(false);
                }}
              />
            ))}
          </View>
        ) : (
          /* Horizontal, not wrapped: the strip is meant to be scanned in one line and scrolled
             past, and `ScrollView` flips its own direction under RTL. */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.xs }}
          >
            {quickCategories.map((category) => (
              <CategoryChipV
                key={category.id}
                icon={categoryIconName(category.icon)}
                label={category.name}
                selected={category.id === categoryId}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
            {/* Offered only when it would actually reveal something: with few enough categories
                the strip already is the complete list, and a "Plus" opening an identical one
                would promise more than it has. */}
            {rankedCategories.length > quickCategories.length ? (
              <CategoryChipV
                icon="layout-grid"
                label={t('expenseForm.categoryMore')}
                selected={false}
                onPress={() => setShowAllCategories(true)}
              />
            ) : null}
          </ScrollView>
        )}
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
        <Button label={t('expenseForm.submit')} onPress={handleSubmit} disabled={!hasUsableAmount} />
        <Button label={t('expenseForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('expenseForm.deleteConfirmMessage')}</Txt>
              <Button
                label={t('expenseForm.deleteConfirmYes')}
                variant="danger"
                onPress={handleConfirmDelete}
              />
              <Button
                label={t('expenseForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button
              label={t('expenseForm.delete')}
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
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
