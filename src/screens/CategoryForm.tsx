import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from '../categories';
import { AppScreen, Button, Card, Chip, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  updateTransaction,
  upsertCategoryBudget,
} from '../db/repositories';
import type { Category, CategoryBudget, Transaction } from '../db/repositories';
import { DEFAULT_CURRENCY_CODE, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

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
  const isEditing = category !== undefined;

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLOR_OPTIONS[0]);
  const [errorName, setErrorName] = useState<string | undefined>(undefined);

  const [capInput, setCapInput] = useState(
    budget ? String(toMajorUnits(budget.capMinor, DEFAULT_CURRENCY_CODE)) : '',
  );
  const [alertThresholdInput, setAlertThresholdInput] = useState(
    budget ? String(toMajorUnits(budget.alertThresholdMinor, DEFAULT_CURRENCY_CODE)) : '',
  );
  const [errorCap, setErrorCap] = useState<string | undefined>(undefined);
  const [errorAlertThreshold, setErrorAlertThreshold] = useState<string | undefined>(undefined);
  const [rolloverEnabled, setRolloverEnabled] = useState(budget?.rolloverEnabled ?? false);

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
    const trimmedAlertThresholdInput = alertThresholdInput.trim();
    let capMinor: number | null = null;
    let alertThresholdMinor: number | null = null;
    setErrorCap(undefined);
    setErrorAlertThreshold(undefined);

    if (trimmedCapInput !== '' || trimmedAlertThresholdInput !== '') {
      capMinor = parseAmountInput(trimmedCapInput, DEFAULT_CURRENCY_CODE);
      if (capMinor === null) {
        setErrorCap(t('categoryForm.errorCap'));
        return;
      }
      if (trimmedAlertThresholdInput === '') {
        // No explicit alert threshold — default to alerting once the cap itself is reached.
        alertThresholdMinor = capMinor;
      } else {
        alertThresholdMinor = parseAmountInput(trimmedAlertThresholdInput, DEFAULT_CURRENCY_CODE);
        if (alertThresholdMinor === null) {
          setErrorAlertThreshold(t('categoryForm.errorAlertThreshold'));
          return;
        }
        if (alertThresholdMinor > capMinor) {
          setErrorAlertThreshold(t('categoryForm.errorAlertThresholdExceedsCap'));
          return;
        }
      }
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
            <Chip key={option} label={option} selected={option === icon} onPress={() => setIcon(option)} />
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
          <TextField
            label={t('categoryForm.alertThresholdLabel')}
            placeholder={t('categoryForm.alertThresholdPlaceholder')}
            value={alertThresholdInput}
            onChangeText={setAlertThresholdInput}
            keyboardType="decimal-pad"
            errorMessage={errorAlertThreshold}
          />
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('categoryForm.rolloverHint')}
          </Txt>
          <Button
            label={rolloverEnabled ? t('categoryForm.rolloverDisable') : t('categoryForm.rolloverEnable')}
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
                    {t('categoryForm.deleteReassignMessage', { count: transactionsToReassign.length })}
                  </Txt>
                  <View style={[styles.chipRow, { gap: theme.spacing.xs }]}>
                    {otherCategories.map((candidate) => (
                      <Chip
                        key={candidate.id}
                        label={candidate.name}
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
                  <Txt size="sm">
                    {t('categoryForm.deleteConfirmMessage')}
                  </Txt>
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
