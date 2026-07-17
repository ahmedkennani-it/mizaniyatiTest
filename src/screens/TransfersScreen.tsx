import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BeneficiaryForm } from './BeneficiaryForm';
import {
  AlertBanner,
  AppScreen,
  Avatar,
  Button,
  Card,
  Chip,
  IconTile,
  ListRow,
  ScreenHeader,
  SectionHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  createDiasporaTransfer,
  listDiasporaBeneficiaries,
  listDiasporaTransfers,
  listHouseholds,
} from '../db/repositories';
import type { DiasporaBeneficiary, DiasporaTransfer, Household } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { convertAmountMinor, DEFAULT_ORIGIN_CURRENCY_CODE } from '../lib/rates';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeAnnualTransferSummary, listTransferYears } from '../transfers';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Diaspora transfers tab (US-045): annual total sent + count, with a picker for previous years.
 * `origin` currency is `DEFAULT_ORIGIN_CURRENCY_CODE` (a placeholder) until US-064 (phase 15) lets
 * a household configure its own — see that constant's own comment. Recurring beneficiaries
 * (US-046) let a household jump straight into a prefilled quick-send; the full "méthode +
 * conversion manuelle" recording flow (US-047) lands in the next phase-11 task and will extend
 * this same `createDiasporaTransfer` call, not replace it.
 */
export function TransfersScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [view, setView] = useState<'list' | 'beneficiaryForm' | 'send'>('list');
  const [transfers, setTransfers] = useState<DiasporaTransfer[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<DiasporaBeneficiary[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [editingBeneficiary, setEditingBeneficiary] = useState<DiasporaBeneficiary | null>(null);
  const [sendingBeneficiary, setSendingBeneficiary] = useState<DiasporaBeneficiary | null>(null);
  const [sendAmountInput, setSendAmountInput] = useState('');
  const [sendDateInput, setSendDateInput] = useState(todayIsoDate());
  const [sendErrors, setSendErrors] = useState<{ amount?: string; date?: string }>({});

  const refresh = useCallback(() => {
    const db = getDatabase();
    listDiasporaTransfers(db).then(setTransfers);
    listDiasporaBeneficiaries(db).then(setBeneficiaries);
    listHouseholds(db).then(setHouseholds);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entitlements.can('transfers')) {
    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('transfersScreen.title')} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('transfersScreen.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('transfersScreen.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  function rhythmLabel(beneficiary: DiasporaBeneficiary): string {
    if (beneficiary.frequency === 'monthly' && beneficiary.usualAmountMinor != null) {
      return t('transfersScreen.beneficiaryRhythmMonthly', {
        amount: formatMoney(beneficiary.usualAmountMinor, currencyCode, language),
      });
    }
    return t('transfersScreen.beneficiaryRhythmOccasional');
  }

  function openBeneficiaryForm(beneficiary: DiasporaBeneficiary | null) {
    setEditingBeneficiary(beneficiary);
    setView('beneficiaryForm');
  }

  function openSendForm(beneficiary: DiasporaBeneficiary) {
    setSendingBeneficiary(beneficiary);
    setSendAmountInput(
      beneficiary.usualAmountMinor != null
        ? String(toMajorUnits(beneficiary.usualAmountMinor, currencyCode))
        : '',
    );
    setSendDateInput(todayIsoDate());
    setSendErrors({});
    setView('send');
  }

  function closeToList() {
    setEditingBeneficiary(null);
    setSendingBeneficiary(null);
    setView('list');
  }

  async function handleSendTransfer() {
    if (!sendingBeneficiary) {
      return;
    }
    const amountMinor = parseAmountInput(sendAmountInput, currencyCode);
    const nextErrors: typeof sendErrors = {};
    if (amountMinor === null) {
      nextErrors.amount = t('transfersScreen.errorSendAmount');
    }
    if (!ISO_DATE_PATTERN.test(sendDateInput)) {
      nextErrors.date = t('transfersScreen.errorSendDate');
    }
    setSendErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountMinor === null) {
      return;
    }

    await createDiasporaTransfer(getDatabase(), {
      amountMinor,
      currencyCode,
      occurredAt: new Date(sendDateInput).toISOString(),
      beneficiaryId: sendingBeneficiary.id,
    });
    refresh();
    closeToList();
  }

  if (view === 'beneficiaryForm') {
    return (
      <BeneficiaryForm
        beneficiary={editingBeneficiary ?? undefined}
        currencyCode={currencyCode}
        onSaved={() => {
          refresh();
          closeToList();
        }}
        onCancel={closeToList}
        onDeleted={() => {
          refresh();
          closeToList();
        }}
      />
    );
  }

  if (view === 'send' && sendingBeneficiary) {
    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader
          title={t('transfersScreen.sendTitle', { name: sendingBeneficiary.name })}
          onBack={closeToList}
        />

        <TextField
          label={t('transfersScreen.sendAmountLabel')}
          value={sendAmountInput}
          onChangeText={setSendAmountInput}
          keyboardType="decimal-pad"
          errorMessage={sendErrors.amount}
        />

        <TextField
          label={t('transfersScreen.sendDateLabel')}
          value={sendDateInput}
          onChangeText={setSendDateInput}
          errorMessage={sendErrors.date}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('transfersScreen.sendSubmit')} onPress={handleSendTransfer} />
          <Button
            label={t('transfersScreen.sendCancel')}
            variant="secondary"
            onPress={closeToList}
          />
          <Button
            label={t('transfersScreen.sendEditBeneficiary')}
            variant="secondary"
            onPress={() => openBeneficiaryForm(sendingBeneficiary)}
          />
        </View>
      </AppScreen>
    );
  }

  const years = listTransferYears(transfers, currentYear);
  const summary = computeAnnualTransferSummary(transfers, selectedYear);
  const approxMinor =
    currencyCode === DEFAULT_ORIGIN_CURRENCY_CODE
      ? null
      : convertAmountMinor(summary.totalMinor, currencyCode, DEFAULT_ORIGIN_CURRENCY_CODE);
  const yearTransfers = transfers.filter(
    (transfer) => new Date(transfer.occurredAt).getUTCFullYear() === selectedYear,
  );

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('transfersScreen.title')} />

      <AlertBanner tone="info" icon="shield-check" message={t('transfersScreen.disclaimer')} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {years.map((year) => (
          <Chip
            key={year}
            label={String(year)}
            selected={year === selectedYear}
            onPress={() => setSelectedYear(year)}
          />
        ))}
      </View>

      <Card
        elevated
        style={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
      >
        <IconTile icon="plane" accent="blue" />
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('transfersScreen.totalLabel')}
        </Txt>
        <Txt weight="extrabold" size="xxl">
          {formatMoney(summary.totalMinor, currencyCode, language)}
        </Txt>
        {approxMinor !== null ? (
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('transfersScreen.approxLabel', {
              amount: formatMoney(approxMinor, DEFAULT_ORIGIN_CURRENCY_CODE, language),
            })}
          </Txt>
        ) : null}
        <Txt size="sm">{t('transfersScreen.countLabel', { count: summary.count })}</Txt>
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader
          title={t('transfersScreen.beneficiariesTitle')}
          actionLabel={t('transfersScreen.addBeneficiaryButton')}
          onActionPress={() => openBeneficiaryForm(null)}
        />
        {beneficiaries.length === 0 ? (
          <Card elevated>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('transfersScreen.beneficiariesEmpty')}
            </Txt>
          </Card>
        ) : (
          beneficiaries.map((beneficiary) => (
            <ListRow
              key={beneficiary.id}
              leading={<Avatar name={beneficiary.name} size={40} accent="blue" />}
              title={beneficiary.name}
              subtitle={`${beneficiary.relationship} · ${rhythmLabel(beneficiary)}`}
              chevron
              onPress={() => openSendForm(beneficiary)}
            />
          ))
        )}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('transfersScreen.historyTitle')} />
        {yearTransfers.length === 0 ? (
          <Card elevated>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('transfersScreen.historyEmpty')}
            </Txt>
          </Card>
        ) : (
          yearTransfers.map((transfer) => (
            <ListRow
              key={transfer.id}
              icon="plane"
              accent="blue"
              title={transfer.occurredAt.slice(0, 10)}
              value={formatMoney(transfer.amountMinor, transfer.currencyCode, language)}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}
