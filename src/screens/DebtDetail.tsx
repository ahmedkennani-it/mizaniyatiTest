import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, ListRow, Pill, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { createDebtRepayment, listDebtRepayments } from '../db/repositories';
import type { Debt, DebtRepayment } from '../db/repositories';
import { computeDebtStatus } from '../debts';
import { useLanguage } from '../i18n';
import { monthKeyOf } from '../i18n/dateFormat';
import { formatMoney, parseAmountInput } from '../money';
import { useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface DebtDetailProps {
  debt: Debt;
  onBack: () => void;
  onDebtChanged: () => void;
}

/**
 * "Remboursement total ou partiel d'une dette" (US-050): a partial repayment reduces the balance
 * and the history keeps every payment; a full one (the "Marquer comme soldée" shortcut, or a
 * partial that happens to clear the balance) is just a repayment equal to what remains — there is
 * no separate "settled" write, `computeDebtStatus` derives it from the same repayment rows.
 */
export function DebtDetail({ debt, onBack, onDebtChanged }: DebtDetailProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [view, setView] = useState<'detail' | 'addRepayment'>('detail');
  const [repayments, setRepayments] = useState<DebtRepayment[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState(todayIsoDate());
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});

  const refresh = useCallback(() => {
    listDebtRepayments(getDatabase()).then(setRepayments);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const debtRepayments = repayments.filter((repayment) => repayment.debtId === debt.id);
  const status = computeDebtStatus(debt, repayments);
  const isDueThisMonth =
    !status.isSettled && debt.dueDate !== null && debt.dueDate.slice(0, 7) === monthKeyOf(new Date());

  async function handleAddRepayment() {
    const amountMinor = parseAmountInput(amountInput, debt.currencyCode);
    const nextErrors: typeof errors = {};
    if (amountMinor === null) {
      nextErrors.amount = t('debtDetail.errorRepaymentAmount');
    } else if (amountMinor > status.remainingMinor) {
      nextErrors.amount = t('debtDetail.errorRepaymentExceeds');
    }
    if (!ISO_DATE_PATTERN.test(dateInput)) {
      nextErrors.date = t('debtDetail.errorRepaymentDate');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null) {
      return;
    }

    await createDebtRepayment(getDatabase(), { debtId: debt.id, amountMinor, date: dateInput });
    setAmountInput('');
    setDateInput(todayIsoDate());
    setView('detail');
    refresh();
    onDebtChanged();
  }

  async function handleMarkSettled() {
    if (status.remainingMinor <= 0) {
      return;
    }
    await createDebtRepayment(getDatabase(), {
      debtId: debt.id,
      amountMinor: status.remainingMinor,
      date: todayIsoDate(),
    });
    refresh();
    onDebtChanged();
  }

  if (view === 'addRepayment') {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('debtDetail.repayButton')} onBack={() => setView('detail')} />

        <TextField
          label={t('debtDetail.repaymentAmountLabel')}
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="decimal-pad"
          errorMessage={errors.amount}
        />

        <TextField
          label={t('debtDetail.repaymentDateLabel')}
          value={dateInput}
          onChangeText={setDateInput}
          errorMessage={errors.date}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('debtDetail.repaymentSubmit')} onPress={handleAddRepayment} />
          <Button
            label={t('debtDetail.repaymentCancel')}
            variant="secondary"
            onPress={() => setView('detail')}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={debt.counterparty} onBack={onBack} />

      <Card
        elevated
        style={{ gap: theme.spacing.sm, alignItems: 'center', paddingVertical: theme.spacing.lg }}
      >
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          {status.isSettled ? (
            <Pill
              label={t('debtDetail.settledBadge')}
              background={theme.accents.teal.wash}
              color={theme.accents.teal.ink}
            />
          ) : null}
          {isDueThisMonth ? (
            <Pill
              label={t('debtDetail.dueThisMonthBadge')}
              background={theme.banner.warningBg}
              color={theme.banner.warningText}
            />
          ) : null}
        </View>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('debtDetail.remainingLabel')}
        </Txt>
        <Txt weight="extrabold" size="xxl">
          {formatMoney(status.remainingMinor, debt.currencyCode, language)}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('debtDetail.originalLabel', {
            amount: formatMoney(debt.amountMinor, debt.currencyCode, language),
          })}
        </Txt>
      </Card>

      {!status.isSettled ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label={t('debtDetail.repayButton')}
            style={{ flex: 1 }}
            onPress={() => setView('addRepayment')}
          />
          <Button
            label={t('debtDetail.repayFullButton')}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={handleMarkSettled}
          />
        </View>
      ) : null}

      <Txt weight="semibold" size="md">
        {t('debtDetail.repaymentsTitle')}
      </Txt>

      {debtRepayments.length === 0 ? (
        <Card elevated style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('debtDetail.emptyRepayments')}
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {debtRepayments.map((repayment) => (
            <ListRow
              key={repayment.id}
              icon="banknote"
              accent="teal"
              title={repayment.date}
              value={formatMoney(repayment.amountMinor, debt.currencyCode, language)}
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}
