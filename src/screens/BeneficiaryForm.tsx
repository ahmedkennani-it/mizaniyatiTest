import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import {
  createDiasporaBeneficiary,
  deleteDiasporaBeneficiary,
  updateDiasporaBeneficiary,
} from '../db/repositories';
import type { DiasporaBeneficiary, DiasporaBeneficiaryFrequency } from '../db/repositories';
import { parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';

export interface BeneficiaryFormProps {
  /** When set, the form edits this beneficiary instead of creating a new one. */
  beneficiary?: DiasporaBeneficiary;
  /** The household's currency (US-046's "300 EUR / mois" is in the sending currency, not the
   *  origin one) — used to parse/prefill the usual-amount field. */
  currencyCode: string;
  onSaved: () => void;
  onCancel: () => void;
  /** Required when `beneficiary` is set — called after a successful delete. */
  onDeleted?: () => void;
}

export function BeneficiaryForm({
  beneficiary,
  currencyCode,
  onSaved,
  onCancel,
  onDeleted,
}: BeneficiaryFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isEditing = beneficiary !== undefined;

  const [name, setName] = useState(beneficiary?.name ?? '');
  const [relationship, setRelationship] = useState(beneficiary?.relationship ?? '');
  const [frequency, setFrequency] = useState<DiasporaBeneficiaryFrequency>(
    beneficiary?.frequency ?? 'monthly',
  );
  const [usualAmountInput, setUsualAmountInput] = useState(
    beneficiary?.usualAmountMinor != null
      ? String(toMajorUnits(beneficiary.usualAmountMinor, currencyCode))
      : '',
  );
  const [errors, setErrors] = useState<{ name?: string; relationship?: string; usualAmount?: string }>(
    {},
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedRelationship = relationship.trim();
    const nextErrors: typeof errors = {};
    if (!trimmedName) {
      nextErrors.name = t('beneficiaryForm.errorName');
    }
    if (!trimmedRelationship) {
      nextErrors.relationship = t('beneficiaryForm.errorRelationship');
    }

    let usualAmountMinor: number | null = null;
    if (frequency === 'monthly' || usualAmountInput.trim()) {
      usualAmountMinor = parseAmountInput(usualAmountInput, currencyCode);
      if (usualAmountMinor === null) {
        nextErrors.usualAmount = t('beneficiaryForm.errorUsualAmount');
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const input = { name: trimmedName, relationship: trimmedRelationship, usualAmountMinor, frequency };
    if (isEditing && beneficiary) {
      await updateDiasporaBeneficiary(getDatabase(), beneficiary.id, input);
    } else {
      await createDiasporaBeneficiary(getDatabase(), input);
    }
    onSaved();
  }

  async function handleConfirmDelete() {
    if (!beneficiary) {
      return;
    }
    await deleteDiasporaBeneficiary(getDatabase(), beneficiary.id);
    onDeleted?.();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader
        title={isEditing ? t('beneficiaryForm.titleEdit') : t('beneficiaryForm.titleNew')}
        onBack={onCancel}
      />

      <TextField
        label={t('beneficiaryForm.nameLabel')}
        placeholder={t('beneficiaryForm.namePlaceholder')}
        value={name}
        onChangeText={setName}
        errorMessage={errors.name}
      />

      <TextField
        label={t('beneficiaryForm.relationshipLabel')}
        placeholder={t('beneficiaryForm.relationshipPlaceholder')}
        value={relationship}
        onChangeText={setRelationship}
        errorMessage={errors.relationship}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('beneficiaryForm.frequencyLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label={t('beneficiaryForm.frequencyMonthly')}
            variant={frequency === 'monthly' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setFrequency('monthly')}
          />
          <Button
            label={t('beneficiaryForm.frequencyOccasional')}
            variant={frequency === 'occasional' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setFrequency('occasional')}
          />
        </View>
      </View>

      <TextField
        label={t('beneficiaryForm.usualAmountLabel')}
        placeholder="0.00"
        value={usualAmountInput}
        onChangeText={setUsualAmountInput}
        keyboardType="decimal-pad"
        errorMessage={errors.usualAmount}
      />
      {frequency === 'occasional' ? (
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('beneficiaryForm.usualAmountHint')}
        </Txt>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('beneficiaryForm.submit')} onPress={handleSubmit} />
        <Button label={t('beneficiaryForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>

      {isEditing ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          {confirmingDelete ? (
            <>
              <Txt size="sm">{t('beneficiaryForm.deleteConfirmMessage')}</Txt>
              <Button
                label={t('beneficiaryForm.deleteConfirmYes')}
                variant="danger"
                onPress={handleConfirmDelete}
              />
              <Button
                label={t('beneficiaryForm.deleteConfirmCancel')}
                variant="secondary"
                onPress={() => setConfirmingDelete(false)}
              />
            </>
          ) : (
            <Button
              label={t('beneficiaryForm.delete')}
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
