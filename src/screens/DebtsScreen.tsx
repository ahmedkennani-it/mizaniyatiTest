import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DebtDetail } from './DebtDetail';
import { DebtForm } from './DebtForm';
import {
  AppScreen,
  Avatar,
  Button,
  Card,
  IconTile,
  ListRow,
  Pill,
  ScreenHeader,
  SectionHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { listDebtRepayments, listDebts, listHouseholds } from '../db/repositories';
import type { Debt, DebtRepayment, Household } from '../db/repositories';
import { computeDebtStatus, computeNetDebtTotals } from '../debts';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { monthKeyOf } from '../i18n/dateFormat';
import { DEFAULT_CURRENCY_CODE, formatMoney } from '../money';
import { useTheme } from '../theme';

export interface DebtsScreenProps {
  onBack: () => void;
}

/**
 * "Vue nette des dettes informelles" (US-048): two headline totals ("On me doit" / "Je dois"),
 * each unsettled debt as a row (avatar, loan date, due date or "pas d'échéance", amount still
 * owed), and a settled section so a repaid debt stays consultable (US-050) without counting toward
 * the totals anymore. `Avatar` reuses `counterparty` — a debt is with a free-text person, not
 * necessarily an app `Member`.
 */
export function DebtsScreen({ onBack }: DebtsScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [repayments, setRepayments] = useState<DebtRepayment[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listDebts(db).then(setDebts);
    listDebtRepayments(db).then(setRepayments);
    listHouseholds(db).then(setHouseholds);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entitlements.can('debts')) {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('debtsScreen.title')} onBack={onBack} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('debtsScreen.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('debtsScreen.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  if (view === 'form') {
    return (
      <DebtForm
        currencyCode={currencyCode}
        onSaved={() => {
          refresh();
          setView('list');
        }}
        onCancel={() => setView('list')}
      />
    );
  }

  if (view === 'detail' && selectedDebt) {
    return (
      <DebtDetail
        debt={selectedDebt}
        onBack={() => {
          setSelectedDebt(null);
          setView('list');
        }}
        onDebtChanged={refresh}
      />
    );
  }

  const monthKey = monthKeyOf(new Date());
  const totals = computeNetDebtTotals(debts, repayments);

  function openDetail(debt: Debt) {
    setSelectedDebt(debt);
    setView('detail');
  }

  function debtRow(debt: Debt) {
    const status = computeDebtStatus(debt, repayments);
    const isDueThisMonth = !status.isSettled && debt.dueDate !== null && debt.dueDate.slice(0, 7) === monthKey;
    return (
      <ListRow
        key={debt.id}
        leading={<Avatar name={debt.counterparty} size={40} />}
        title={debt.counterparty}
        subtitle={`${debt.date} · ${
          debt.dueDate ? t('debtsScreen.dueDateLabel', { date: debt.dueDate }) : t('debtsScreen.noDueDateLabel')
        }`}
        trailing={
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Txt weight="semibold" size="sm">
              {formatMoney(status.remainingMinor, debt.currencyCode, language)}
            </Txt>
            {status.isSettled ? (
              <Pill
                label={t('debtsScreen.settledBadge')}
                background={theme.accents.teal.wash}
                color={theme.accents.teal.ink}
              />
            ) : isDueThisMonth ? (
              <Pill
                label={t('debtsScreen.dueThisMonthBadge')}
                background={theme.banner.warningBg}
                color={theme.banner.warningText}
              />
            ) : null}
          </View>
        }
        onPress={() => openDetail(debt)}
      />
    );
  }

  const owedToHousehold = debts.filter(
    (debt) => debt.direction === 'owed_to_household' && !computeDebtStatus(debt, repayments).isSettled,
  );
  const householdOwes = debts.filter(
    (debt) => debt.direction === 'household_owes' && !computeDebtStatus(debt, repayments).isSettled,
  );
  const settled = debts.filter((debt) => computeDebtStatus(debt, repayments).isSettled);

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('debtsScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('debtsScreen.subtitle')}
      </Txt>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Card
          elevated
          style={{ flex: 1, gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
        >
          <IconTile icon="handshake" accent="teal" />
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('debtsScreen.owedToHouseholdTitle')}
          </Txt>
          <Txt weight="extrabold" size="xl">
            {formatMoney(totals.owedToHouseholdMinor, currencyCode, language)}
          </Txt>
        </Card>
        <Card
          elevated
          style={{ flex: 1, gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
        >
          <IconTile icon="banknote" accent="coral" />
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('debtsScreen.householdOwesTitle')}
          </Txt>
          <Txt weight="extrabold" size="xl">
            {formatMoney(totals.householdOwesMinor, currencyCode, language)}
          </Txt>
        </Card>
      </View>

      {debts.length === 0 ? (
        <Card elevated style={{ alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
            {t('debtsScreen.emptyState')}
          </Txt>
          <Button label={t('debtsScreen.addButton')} onPress={() => setView('form')} />
        </Card>
      ) : (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader
              title={t('debtsScreen.owedToHouseholdTitle')}
              actionLabel={t('debtsScreen.addButton')}
              onActionPress={() => setView('form')}
            />
            {owedToHousehold.length === 0 ? null : owedToHousehold.map(debtRow)}
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={t('debtsScreen.householdOwesTitle')} />
            {householdOwes.length === 0 ? null : householdOwes.map(debtRow)}
          </View>

          {settled.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <SectionHeader title={t('debtsScreen.settledSectionTitle')} />
              {settled.map(debtRow)}
            </View>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
