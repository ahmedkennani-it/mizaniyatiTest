import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AlertBanner,
  AppScreen,
  Card,
  Chip,
  IconTile,
  ListRow,
  ScreenHeader,
  SectionHeader,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { listDiasporaTransfers, listHouseholds } from '../db/repositories';
import type { DiasporaTransfer, Household } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { convertAmountMinor, DEFAULT_ORIGIN_CURRENCY_CODE } from '../lib/rates';
import { DEFAULT_CURRENCY_CODE, formatMoney } from '../money';
import { useTheme } from '../theme';
import { computeAnnualTransferSummary, listTransferYears } from '../transfers';

/**
 * Diaspora transfers tab (US-045): annual total sent + count, with a picker for previous years.
 * `origin` currency is `DEFAULT_ORIGIN_CURRENCY_CODE` (a placeholder) until US-064 (phase 15) lets
 * a household configure its own — see that constant's own comment. Recording a transfer (US-047)
 * and recurring beneficiaries (US-046) land in later phase-11 tasks; this screen already reads
 * whatever `diaspora_transfers` rows exist by then.
 */
export function TransfersScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [transfers, setTransfers] = useState<DiasporaTransfer[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listDiasporaTransfers(db).then(setTransfers);
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
