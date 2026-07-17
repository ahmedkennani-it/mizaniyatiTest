import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

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
import type {
  DiasporaBeneficiary,
  DiasporaTransfer,
  DiasporaTransferMethod,
  Household,
} from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import {
  convertAmountMinor,
  convertAmountMinorWithRate,
  DEFAULT_ORIGIN_CURRENCY_CODE,
  MOCK_RATES_UPDATED_AT,
} from '../lib/rates';
import type { RootTabParamList } from '../navigation';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeAnnualTransferSummary, listTransferYears } from '../transfers';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const METHODS: DiasporaTransferMethod[] = ['wise', 'cash', 'other'];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A plain ratio (e.g. "10.8"), not a currency amount — accepts `.` or `,`, rejects anything <= 0. */
function parsePositiveRate(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '' || Number.isNaN(Number(normalized))) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * React Navigation hands every tab screen its `navigation`/`route`; both are optional here so the
 * screen still mounts on its own in tests, like every other screen in this codebase.
 */
export type TransfersScreenProps = Partial<
  Pick<BottomTabScreenProps<RootTabParamList, 'transfers'>, 'navigation' | 'route'>
>;

/**
 * Diaspora transfers tab (US-045): annual total sent + count, with a picker for previous years.
 * Recurring beneficiaries (US-046) let a household jump into a prefilled record; the full
 * recording form (US-047) adds method + an indicative or manual conversion, snapshotted at
 * recording time so a later rate change never rewrites a past transfer's contre-valeur. `origin`
 * currency is `DEFAULT_ORIGIN_CURRENCY_CODE` (a placeholder) until US-064 (phase 15) lets a
 * household configure its own — see that constant's own comment.
 */
export function TransfersScreen({ navigation, route }: TransfersScreenProps = {}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [view, setView] = useState<'list' | 'beneficiaryForm' | 'recordForm'>('list');
  const [transfers, setTransfers] = useState<DiasporaTransfer[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<DiasporaBeneficiary[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [editingBeneficiary, setEditingBeneficiary] = useState<DiasporaBeneficiary | null>(null);

  const [recordBeneficiaryId, setRecordBeneficiaryId] = useState<string | null>(null);
  const [recordAmountInput, setRecordAmountInput] = useState('');
  const [recordDateInput, setRecordDateInput] = useState(todayIsoDate());
  const [recordMethod, setRecordMethod] = useState<DiasporaTransferMethod>('other');
  const [recordRateMode, setRecordRateMode] = useState<'auto' | 'manual'>('auto');
  const [recordManualRateInput, setRecordManualRateInput] = useState('');
  const [recordErrors, setRecordErrors] = useState<{
    amount?: string;
    date?: string;
    manualRate?: string;
  }>({});

  const refresh = useCallback(() => {
    const db = getDatabase();
    listDiasporaTransfers(db).then(setTransfers);
    listDiasporaBeneficiaries(db).then(setBeneficiaries);
    listHouseholds(db).then(setHouseholds);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The dashboard's "Envoyer au {pays}" shortcut (US-047) opens straight into the recording form
  // rather than landing on the tab's default list.
  useEffect(() => {
    if (route?.params?.openRecordForm) {
      setRecordBeneficiaryId(null);
      setRecordAmountInput('');
      setRecordDateInput(todayIsoDate());
      setRecordMethod('other');
      setRecordRateMode('auto');
      setRecordManualRateInput('');
      setRecordErrors({});
      setView('recordForm');
      navigation?.setParams({ openRecordForm: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.openRecordForm]);

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
  const needsConversion = currencyCode !== DEFAULT_ORIGIN_CURRENCY_CODE;
  const beneficiaryById = new Map(beneficiaries.map((beneficiary) => [beneficiary.id, beneficiary] as const));

  function methodLabel(method: DiasporaTransferMethod): string {
    return t(`transfersScreen.method${method.charAt(0).toUpperCase()}${method.slice(1)}`);
  }

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

  function openRecordForm(beneficiary: DiasporaBeneficiary | null) {
    setRecordBeneficiaryId(beneficiary?.id ?? null);
    setRecordAmountInput(
      beneficiary?.usualAmountMinor != null
        ? String(toMajorUnits(beneficiary.usualAmountMinor, currencyCode))
        : '',
    );
    setRecordDateInput(todayIsoDate());
    setRecordMethod('other');
    setRecordRateMode('auto');
    setRecordManualRateInput('');
    setRecordErrors({});
    setView('recordForm');
  }

  function closeToList() {
    setEditingBeneficiary(null);
    setView('list');
  }

  const recordAmountMinorPreview = parseAmountInput(recordAmountInput, currencyCode);
  const recordManualRateValue = parsePositiveRate(recordManualRateInput);
  const recordOriginMinorPreview = !needsConversion
    ? null
    : recordAmountMinorPreview === null
      ? null
      : recordRateMode === 'manual'
        ? recordManualRateValue !== null
          ? convertAmountMinorWithRate(
              recordAmountMinorPreview,
              currencyCode,
              DEFAULT_ORIGIN_CURRENCY_CODE,
              recordManualRateValue,
            )
          : null
        : convertAmountMinor(recordAmountMinorPreview, currencyCode, DEFAULT_ORIGIN_CURRENCY_CODE);

  async function handleRecordSubmit() {
    const nextErrors: typeof recordErrors = {};
    if (recordAmountMinorPreview === null) {
      nextErrors.amount = t('transfersScreen.errorSendAmount');
    }
    if (!ISO_DATE_PATTERN.test(recordDateInput)) {
      nextErrors.date = t('transfersScreen.errorSendDate');
    }
    if (needsConversion && recordRateMode === 'manual' && recordManualRateValue === null) {
      nextErrors.manualRate = t('transfersScreen.errorManualRate');
    }
    setRecordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || recordAmountMinorPreview === null) {
      return;
    }

    const originAmountMinor = !needsConversion
      ? null
      : recordRateMode === 'manual'
        ? convertAmountMinorWithRate(
            recordAmountMinorPreview,
            currencyCode,
            DEFAULT_ORIGIN_CURRENCY_CODE,
            recordManualRateValue as number,
          )
        : convertAmountMinor(recordAmountMinorPreview, currencyCode, DEFAULT_ORIGIN_CURRENCY_CODE);

    await createDiasporaTransfer(getDatabase(), {
      amountMinor: recordAmountMinorPreview,
      currencyCode,
      occurredAt: new Date(recordDateInput).toISOString(),
      beneficiaryId: recordBeneficiaryId,
      method: recordMethod,
      originAmountMinor,
      rateIsManual: needsConversion && recordRateMode === 'manual',
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

  if (view === 'recordForm') {
    const selectedBeneficiary = recordBeneficiaryId ? beneficiaryById.get(recordBeneficiaryId) : undefined;

    return (
      <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('transfersScreen.recordTitle')} onBack={() => setView('list')} />

        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('transfersScreen.recordBeneficiaryLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Chip
              label={t('transfersScreen.recordNoBeneficiary')}
              selected={recordBeneficiaryId === null}
              onPress={() => setRecordBeneficiaryId(null)}
            />
            {beneficiaries.map((beneficiary) => (
              <Chip
                key={beneficiary.id}
                label={beneficiary.name}
                selected={recordBeneficiaryId === beneficiary.id}
                onPress={() => {
                  setRecordBeneficiaryId(beneficiary.id);
                  if (beneficiary.usualAmountMinor != null) {
                    setRecordAmountInput(String(toMajorUnits(beneficiary.usualAmountMinor, currencyCode)));
                  }
                }}
              />
            ))}
          </View>
        </View>

        <TextField
          label={t('transfersScreen.sendAmountLabel')}
          value={recordAmountInput}
          onChangeText={setRecordAmountInput}
          keyboardType="decimal-pad"
          errorMessage={recordErrors.amount}
        />

        <TextField
          label={t('transfersScreen.sendDateLabel')}
          value={recordDateInput}
          onChangeText={setRecordDateInput}
          errorMessage={recordErrors.date}
        />

        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('transfersScreen.recordMethodLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            {METHODS.map((method) => (
              <Chip
                key={method}
                label={methodLabel(method)}
                selected={recordMethod === method}
                onPress={() => setRecordMethod(method)}
              />
            ))}
          </View>
        </View>

        {needsConversion ? (
          <Card elevated style={{ gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                label={t('transfersScreen.rateModeAuto')}
                variant={recordRateMode === 'auto' ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
                onPress={() => setRecordRateMode('auto')}
              />
              <Button
                label={t('transfersScreen.rateModeManual')}
                variant={recordRateMode === 'manual' ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
                onPress={() => setRecordRateMode('manual')}
              />
            </View>
            {recordRateMode === 'manual' ? (
              <TextField
                label={t('transfersScreen.manualRateLabel')}
                value={recordManualRateInput}
                onChangeText={setRecordManualRateInput}
                keyboardType="decimal-pad"
                errorMessage={recordErrors.manualRate}
              />
            ) : (
              <Txt size="xs" color={theme.colors.textSecondary}>
                {t('transfersScreen.rateSourceNote', { date: MOCK_RATES_UPDATED_AT })}
              </Txt>
            )}
            {recordOriginMinorPreview !== null ? (
              <Txt weight="semibold" size="sm">
                {t('transfersScreen.conversionPreview', {
                  amount: formatMoney(recordOriginMinorPreview, DEFAULT_ORIGIN_CURRENCY_CODE, language),
                })}
              </Txt>
            ) : null}
          </Card>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <Button label={t('transfersScreen.recordSubmit')} onPress={handleRecordSubmit} />
          <Button
            label={t('transfersScreen.sendCancel')}
            variant="secondary"
            onPress={() => setView('list')}
          />
          {selectedBeneficiary ? (
            <Button
              label={t('transfersScreen.sendEditBeneficiary')}
              variant="secondary"
              onPress={() => openBeneficiaryForm(selectedBeneficiary)}
            />
          ) : null}
        </View>
      </AppScreen>
    );
  }

  const years = listTransferYears(transfers, currentYear);
  const summary = computeAnnualTransferSummary(transfers, selectedYear);
  const approxMinor = !needsConversion
    ? null
    : convertAmountMinor(summary.totalMinor, currencyCode, DEFAULT_ORIGIN_CURRENCY_CODE);
  const yearTransfers = transfers.filter(
    (transfer) => new Date(transfer.occurredAt).getUTCFullYear() === selectedYear,
  );

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('transfersScreen.title')} />

      <AlertBanner tone="info" icon="shield-check" message={t('transfersScreen.disclaimer')} />

      <Button label={t('transfersScreen.recordButton')} onPress={() => openRecordForm(null)} />

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
              onPress={() => openRecordForm(beneficiary)}
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
              subtitle={[
                methodLabel(transfer.method),
                transfer.beneficiaryId ? beneficiaryById.get(transfer.beneficiaryId)?.name : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Txt weight="semibold" size="sm">
                    {formatMoney(transfer.amountMinor, transfer.currencyCode, language)}
                  </Txt>
                  {transfer.originAmountMinor !== null ? (
                    <Txt size="xs" color={theme.colors.textSecondary}>
                      {t('transfersScreen.approxLabel', {
                        amount: formatMoney(
                          transfer.originAmountMinor,
                          DEFAULT_ORIGIN_CURRENCY_CODE,
                          language,
                        ),
                      })}
                    </Txt>
                  ) : null}
                </View>
              }
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}
