import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { createVault, deleteVault, updateVault } from '../db/repositories';
import type { Vault } from '../db/repositories';
import { DEFAULT_CURRENCY_CODE, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface VaultFormProps {
  /** When set, the form edits this vault instead of creating a new one. */
  vault?: Vault;
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `vault` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function VaultForm({ vault, onSaved, onCancel, onDeleted }: VaultFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isEditing = vault !== undefined;

  const [name, setName] = useState(vault?.name ?? '');
  const [targetInput, setTargetInput] = useState(
    vault ? String(toMajorUnits(vault.targetMinor, vault.currencyCode)) : '',
  );
  const [deadlineInput, setDeadlineInput] = useState(vault?.deadline ?? '');
  const [errors, setErrors] = useState<{ name?: string; target?: string; deadline?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
      <ScreenHeader title={isEditing ? t('vaultForm.titleEdit') : t('vaultForm.titleNew')} onBack={onCancel} />

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

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('vaultForm.submit')} onPress={handleSubmit} />
        <Button label={t('vaultForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('vaultForm.deleteConfirmMessage')}</Txt>
              <Button label={t('vaultForm.deleteConfirmYes')} variant="danger" onPress={handleConfirmDelete} />
              <Button
                label={t('vaultForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button label={t('vaultForm.delete')} variant="danger" onPress={() => setConfirmingDelete(true)} />
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
