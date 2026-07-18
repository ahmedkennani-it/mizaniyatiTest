import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS, resolveCategoryDisplayName } from '../categories';
import { AppScreen, Button, Card, Chip, NumericKeypad, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  updateTransaction,
  upsertCategoryBudget,
} from '../db/repositories';
import type { Category, CategoryBudget, Transaction } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** US-028: quick cap presets, in major units (MAD). */
const CAP_PRESETS_MAJOR = [2500, 3000, 3500, 4000];

/** US-029: alert-threshold percentages offered instead of a free-text MAD amount. */
const THRESHOLD_PERCENT_OPTIONS = [50, 70, 80, 90, 100];
const DEFAULT_THRESHOLD_PERCENT = 80;

export interface CategoryFormProps {
  /** When set, the form edits this category instead of creating a new one. */
  category?: Category;
  /** The category's current budget, if one has been configured. Ignored when creating. */
  budget?: CategoryBudget;
  /** All other categories (excluding `category`) — used as reassignment targets on delete. */
  otherCategories: Category[];
  /** Transactions currently filed under `category` — empty when creating or when none exist. */
  transactionsToReassign: Transaction[];
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `category` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function CategoryForm({
  category,
  budget,
  otherCategories,
  transactionsToReassign,
  onSaved,
  onCancel,
  onDeleted,
}: CategoryFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEditing = category !== undefined;

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLOR_OPTIONS[0]);
  const [errorName, setErrorName] = useState<string | undefined>(undefined);

  const [capInput, setCapInput] = useState(
    budget ? String(toMajorUnits(budget.capMinor, DEFAULT_CURRENCY_CODE)) : '',
  );
  const [thresholdPercent, setThresholdPercent] = useState<number>(() => {
    if (budget && budget.capMinor > 0) {
      const impliedPercent = Math.round((budget.alertThresholdMinor / budget.capMinor) * 100);
      if (THRESHOLD_PERCENT_OPTIONS.includes(impliedPercent)) {
        return impliedPercent;
      }
    }
    return DEFAULT_THRESHOLD_PERCENT;
  });
  const [errorCap, setErrorCap] = useState<string | undefined>(undefined);
  const [rolloverEnabled, setRolloverEnabled] = useState(budget?.rolloverEnabled ?? false);

  // US-028: "un plafond inférieur au déjà dépensé" — known before the user asks, same reasoning
  // as the Save button disabled at zero elsewhere in the app.
  const monthKey = currentMonthKey();
  const spentThisMonthMinor = transactionsToReassign
    .filter(
      (transaction) => transaction.type === 'expense' && transaction.occurredAt.slice(0, 7) === monthKey,
    )
    .reduce((sum, transaction) => sum + transaction.amountMinor, 0);
  const capInputMinor = parseAmountInput(capInput, DEFAULT_CURRENCY_CODE);
  const capBelowSpent = capInputMinor !== null && capInputMinor < spentThisMonthMinor;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const defaultReassignTarget =
    otherCategories.find((candidate) => candidate.name === 'Autres' || candidate.name === 'أخرى') ??
    otherCategories[0];
  const [reassignToCategoryId, setReassignToCategoryId] = useState<string | null>(
    defaultReassignTarget?.id ?? null,
  );

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorName(t('categoryForm.errorName'));
      return;
    }
    setErrorName(undefined);

    const trimmedCapInput = capInput.trim();
    let capMinor: number | null = null;
    let alertThresholdMinor: number | null = null;
    setErrorCap(undefined);

    if (trimmedCapInput !== '') {
      capMinor = parseAmountInput(trimmedCapInput, DEFAULT_CURRENCY_CODE);
      if (capMinor === null) {
        setErrorCap(t('categoryForm.errorCap'));
        return;
      }
      // The threshold is a percentage of the cap (US-029), always derivable — no separate
      // free-text amount that could disagree with it or go unset.
      alertThresholdMinor = Math.round((capMinor * thresholdPercent) / 100);
    }

    if (isEditing && category) {
      await updateCategory(getDatabase(), category.id, { name: trimmedName, icon, color });
    } else {
      await createCategory(getDatabase(), { name: trimmedName, icon, color });
    }

    if (isEditing && category && capMinor !== null && alertThresholdMinor !== null) {
      await upsertCategoryBudget(getDatabase(), category.id, {
        month: currentMonthKey(),
        capMinor,
        alertThresholdMinor,
        rolloverEnabled,
      });
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!category) {
      return;
    }
    const db = getDatabase();
    if (transactionsToReassign.length > 0 && reassignToCategoryId) {
      for (const transaction of transactionsToReassign) {
        await updateTransaction(db, transaction.id, { categoryId: reassignToCategoryId });
      }
    }
    await deleteCategory(db, category.id);
    onDeleted?.();
  }

  const isLastCategory = isEditing && otherCategories.length === 0;

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={isEditing ? t('categoryForm.titleEdit') : t('categoryForm.titleNew')}
        onBack={onCancel}
      />

      <TextField
        label={t('categoryForm.nameLabel')}
        placeholder={t('categoryForm.namePlaceholder')}
        value={name}
        onChangeText={setName}
        errorMessage={errorName}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('categoryForm.iconLabel')}
        </Txt>
        <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
          {CATEGORY_ICON_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={option === icon}
              onPress={() => setIcon(option)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('categoryForm.colorLabel')}
        </Txt>
        <View style={[styles.chipRow, { gap: theme.spacing.sm }]}>
          {CATEGORY_COLOR_OPTIONS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: option === color }}
              onPress={() => setColor(option)}
              style={[
                styles.swatch,
                {
                  backgroundColor: option,
                  borderRadius: theme.radius.full,
                  borderColor: option === color ? theme.colors.textPrimary : 'transparent',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('categoryForm.budgetTitle')}
          </Txt>
          <TextField
            label={t('categoryForm.capLabel')}
            placeholder={t('categoryForm.capPlaceholder')}
            value={capInput}
            onChangeText={setCapInput}
            keyboardType="decimal-pad"
            errorMessage={errorCap}
          />
          {/* US-028: "éditable au clavier numérique" — the same custom keypad as the expense
              amount (US-016), for the same reason (the OS decimal key varies by platform/locale).
              The field above stays editable in parallel, as it does there. */}
          <NumericKeypad value={capInput} onChange={setCapInput} currencyCode={DEFAULT_CURRENCY_CODE} />
          <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
            {CAP_PRESETS_MAJOR.map((preset) => (
              <Chip
                key={preset}
                label={`${preset}`}
                selected={capInputMinor === preset * 100}
                onPress={() => setCapInput(String(preset))}
              />
            ))}
          </View>
          {capBelowSpent ? (
            <Txt size="xs" color={theme.colors.danger}>
              {t('categoryForm.capBelowSpentWarning', {
                amount: formatMoney(spentThisMonthMinor, DEFAULT_CURRENCY_CODE, language),
              })}
            </Txt>
          ) : null}

          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('categoryForm.alertThresholdLabel')}
          </Txt>
          <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
            {THRESHOLD_PERCENT_OPTIONS.map((percent) => (
              <Chip
                key={percent}
                label={`${percent}%`}
                selected={percent === thresholdPercent}
                onPress={() => setThresholdPercent(percent)}
              />
            ))}
          </View>
          {capInputMinor !== null ? (
            <Txt size="xs" color={theme.colors.textSecondary}>
              {t('categoryForm.thresholdPreview', {
                amount: formatMoney(
                  Math.round((capInputMinor * thresholdPercent) / 100),
                  DEFAULT_CURRENCY_CODE,
                  language,
                ),
              })}
            </Txt>
          ) : null}

          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('categoryForm.rolloverHint')}
          </Txt>
          <Button
            label={
              rolloverEnabled ? t('categoryForm.rolloverDisable') : t('categoryForm.rolloverEnable')
            }
            variant={rolloverEnabled ? 'primary' : 'secondary'}
            onPress={() => setRolloverEnabled((current) => !current)}
          />
        </Card>
      ) : null}

      <Card style={{ gap: theme.spacing.sm }}>
        <Button label={t('categoryForm.submit')} onPress={handleSubmit} />
        <Button label={t('categoryForm.cancel')} variant="secondary" onPress={onCancel} />
      </Card>

      {isEditing ? (
        <Card style={{ gap: theme.spacing.sm }}>
          {isLastCategory ? (
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('categoryForm.deleteBlockedLastCategory')}
            </Txt>
          ) : confirmingDelete ? (
            <>
              {transactionsToReassign.length > 0 ? (
                <>
                  <Txt size="sm">
                    {t('categoryForm.deleteReassignMessage', {
                      count: transactionsToReassign.length,
                    })}
                  </Txt>
                  <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
                    {otherCategories.map((candidate) => (
                      <Chip
                        key={candidate.id}
                        label={resolveCategoryDisplayName(candidate, language)}
                        selected={candidate.id === reassignToCategoryId}
                        onPress={() => setReassignToCategoryId(candidate.id)}
                      />
                    ))}
                  </View>
                  <Button
                    label={t('categoryForm.deleteReassignConfirm')}
                    variant="danger"
                    onPress={handleConfirmDelete}
                    disabled={!reassignToCategoryId}
                  />
                </>
              ) : (
                <>
                  <Txt size="sm">{t('categoryForm.deleteConfirmMessage')}</Txt>
                  <Button
                    label={t('categoryForm.deleteConfirmYes')}
                    variant="danger"
                    onPress={handleConfirmDelete}
                  />
                </>
              )}
              <Button
                label={t('categoryForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button
              label={t('categoryForm.delete')}
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
  swatch: {
    width: 36,
    height: 36,
    borderWidth: 2,
  },
});
