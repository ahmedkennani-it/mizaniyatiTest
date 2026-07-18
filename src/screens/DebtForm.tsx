import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { createDebt } from '../db/repositories';
import type { DebtDirection } from '../db/repositories';
import { parseAmountInput } from '../money';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface DebtFormProps {
  /** The household's own currency — a debt is always logged in it, like every other manual entry. */
  currencyCode: string;
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * "Ajout d'une dette ou d'un prêt" (US-049): direction, counterparty, amount, loan date, and an
 * optional due date. No interest field exists anywhere on this form or in `Debt` itself — the
 * business rule ("aucun intérêt n'est jamais calculé ni proposé") is enforced structurally, not by
 * validation.
 */
export function DebtForm({ currencyCode, onSaved, onCancel }: DebtFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [direction, setDirection] = useState<DebtDirection>('owed_to_household');
  const [counterparty, setCounterparty] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState(todayIsoDate());
  const [dueDateInput, setDueDateInput] = useState('');
  const [errors, setErrors] = useState<{
    counterparty?: string;
    amount?: string;
    date?: string;
    dueDate?: string;
  }>({});

  async function handleSubmit() {
    const trimmedCounterparty = counterparty.trim();
    const amountMinor = parseAmountInput(amountInput, currencyCode);
    const nextErrors: typeof errors = {};
    if (!trimmedCounterparty) {
      nextErrors.counterparty = t('debtForm.errorCounterparty');
    }
    if (amountMinor === null) {
      nextErrors.amount = t('debtForm.errorAmount');
    }
    if (!ISO_DATE_PATTERN.test(dateInput)) {
      nextErrors.date = t('debtForm.errorDate');
    }
    if (dueDateInput && !ISO_DATE_PATTERN.test(dueDateInput)) {
      nextErrors.dueDate = t('debtForm.errorDueDate');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null) {
      return;
    }

    await createDebt(getDatabase(), {
      label: trimmedCounterparty,
      counterparty: trimmedCounterparty,
      direction,
      amountMinor,
      currencyCode,
      date: dateInput,
      dueDate: dueDateInput || null,
    });
    onSaved();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('debtForm.title')} onBack={onCancel} />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('debtForm.directionLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label={t('debtForm.directionOwedToHousehold')}
            variant={direction === 'owed_to_household' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setDirection('owed_to_household')}
          />
          <Button
            label={t('debtForm.directionHouseholdOwes')}
            variant={direction === 'household_owes' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setDirection('household_owes')}
          />
        </View>
      </View>

      <TextField
        label={t('debtForm.counterpartyLabel')}
        placeholder={t('debtForm.counterpartyPlaceholder')}
        value={counterparty}
        onChangeText={setCounterparty}
        errorMessage={errors.counterparty}
      />

      <TextField
        label={t('debtForm.amountLabel')}
        placeholder={t('debtForm.amountPlaceholder')}
        value={amountInput}
        onChangeText={setAmountInput}
        keyboardType="decimal-pad"
        errorMessage={errors.amount}
      />

      <TextField
        label={t('debtForm.dateLabel')}
        value={dateInput}
        onChangeText={setDateInput}
        errorMessage={errors.date}
      />

      <TextField
        label={t('debtForm.dueDateLabel')}
        value={dueDateInput}
        onChangeText={setDueDateInput}
        errorMessage={errors.dueDate}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('debtForm.submit')} onPress={handleSubmit} />
        <Button label={t('debtForm.cancel')} variant="secondary" onPress={onCancel} />
      </View>
    </AppScreen>
  );
}
