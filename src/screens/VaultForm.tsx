import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { createVault, deleteVault, updateVault } from '../db/repositories';
import type { Vault, VaultContribution } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeVaultStatus } from '../vaults';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface VaultFormProps {
  /** When set, the form edits this vault instead of creating a new one. */
  vault?: Vault;
  /** Already-saved amount for `vault`, for the live suggested-monthly preview — 0/omitted for a
   *  new vault, since nothing has been contributed to it yet. */
  savedMinor?: number;
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `vault` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function VaultForm({ vault, savedMinor = 0, onSaved, onCancel, onDeleted }: VaultFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEditing = vault !== undefined;

  const [name, setName] = useState(vault?.name ?? '');
  const [targetInput, setTargetInput] = useState(
    vault ? String(toMajorUnits(vault.targetMinor, vault.currencyCode)) : '',
  );
  const [deadlineInput, setDeadlineInput] = useState(vault?.deadline ?? '');
  const [errors, setErrors] = useState<{ name?: string; target?: string; deadline?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // US-033: "l'app calcule et affiche le versement mensuel suggéré" — live, while still typing,
  // reusing the exact same math the detail screen uses rather than a second implementation of it.
  const targetMinorPreview = parseAmountInput(targetInput, DEFAULT_CURRENCY_CODE);
  const suggestedMonthlyPreview = (() => {
    if (targetMinorPreview === null || !ISO_DATE_PATTERN.test(deadlineInput)) {
      return null;
    }
    const previewVault: Vault = {
      id: 'preview',
      name: '',
      targetMinor: targetMinorPreview,
      currencyCode: DEFAULT_CURRENCY_CODE,
      deadline: deadlineInput,
      createdAt: '',
      updatedAt: '',
    };
    const previewContributions: VaultContribution[] =
      savedMinor > 0
        ? [
            {
              id: 'preview',
              vaultId: 'preview',
              amountMinor: savedMinor,
              memberId: '',
              date: '',
              note: null,
              createdAt: '',
              updatedAt: '',
            },
          ]
        : [];
    return computeVaultStatus(previewVault, previewContributions).suggestedMonthlyMinor;
  })();

  async function handleSubmit() {
    const trimmedName = name.trim();
    const targetMinor = parseAmountInput(targetInput, DEFAULT_CURRENCY_CODE);
    const nextErrors: typeof errors = {};
    if (!trimmedName) {
      nextErrors.name = t('vaultForm.errorName');
    }
    if (targetMinor === null) {
      nextErrors.target = t('vaultForm.errorTarget');
    }
    if (deadlineInput && !ISO_DATE_PATTERN.test(deadlineInput)) {
      nextErrors.deadline = t('vaultForm.errorDeadline');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || targetMinor === null) {
      return;
    }

    const input = {
      name: trimmedName,
      targetMinor,
      currencyCode: DEFAULT_CURRENCY_CODE,
      deadline: deadlineInput || null,
    };

    if (isEditing && vault) {
      await updateVault(getDatabase(), vault.id, input);
    } else {
      await createVault(getDatabase(), input);
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!vault) {
      return;
    }
    await deleteVault(getDatabase(), vault.id);
    onDeleted?.();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={isEditing ? t('vaultForm.titleEdit') : t('vaultForm.titleNew')}
        onBack={onCancel}
      />

      <TextField
        label={t('vaultForm.nameLabel')}
        placeholder={t('vaultForm.namePlaceholder')}
        value={name}
        onChangeText={setName}
        errorMessage={errors.name}
      />

      <TextField
        label={t('vaultForm.targetLabel')}
        placeholder={t('vaultForm.targetPlaceholder')}
        value={targetInput}
        onChangeText={setTargetInput}
        keyboardType="decimal-pad"
        errorMessage={errors.target}
      />

      <TextField
        label={t('vaultForm.deadlineLabel')}
        value={deadlineInput}
        onChangeText={setDeadlineInput}
        errorMessage={errors.deadline}
      />
      {suggestedMonthlyPreview !== null ? (
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('vaultForm.suggestedMonthlyPreview', {
            amount: formatMoney(suggestedMonthlyPreview, DEFAULT_CURRENCY_CODE, language),
          })}
        </Txt>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('vaultForm.submit')} onPress={handleSubmit} />
        <Button label={t('vaultForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('vaultForm.deleteConfirmMessage')}</Txt>
              <Button
                label={t('vaultForm.deleteConfirmYes')}
                variant="danger"
                onPress={handleConfirmDelete}
              />
              <Button
                label={t('vaultForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button
              label={t('vaultForm.delete')}
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
