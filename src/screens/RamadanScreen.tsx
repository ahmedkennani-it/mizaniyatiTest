import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppScreen,
  Button,
  Card,
  IconTile,
  ListRow,
  ScreenHeader,
  SectionHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  listCategories,
  listSeasonalThemes,
  listTransactions,
  updateSeasonalTheme,
} from '../db/repositories';
import type { Category, SeasonalTheme, Transaction } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput } from '../money';
import { resolveCategoryDisplayName } from '../categories';
import { activateRamadanTheme, computeSeasonalThemeStatus } from '../seasonalThemes';
import { ramadanSurface, useTheme } from '../theme';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RamadanScreenProps {
  onBack: () => void;
  onNavigateToZakat: () => void;
}

export function RamadanScreen({ onBack, onNavigateToZakat }: RamadanScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [themes, setThemes] = useState<SeasonalTheme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [envelopeInput, setEnvelopeInput] = useState('');
  const [startDateInput, setStartDateInput] = useState(todayIsoDate());
  const [endDateInput, setEndDateInput] = useState('');
  const [errors, setErrors] = useState<{ envelope?: string; startDate?: string; endDate?: string }>(
    {},
  );

  const refresh = useCallback(() => {
    const db = getDatabase();
    listSeasonalThemes(db).then(setThemes);
    listCategories(db).then(setCategories);
    listTransactions(db).then(setTransactions);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Warm seasonal surface for the whole screen (design's Ramadan theme).
  const warmBg = theme.colorScheme === 'dark' ? undefined : ramadanSurface.background;

  if (!entitlements.can('ramadan')) {
    return (
      <AppScreen scroll background={warmBg} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('ramadanScreen.title')} onBack={onBack} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('ramadanScreen.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('ramadanScreen.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  const activeTheme =
    themes.find((candidate) => candidate.type === 'ramadan' && candidate.active) ?? null;

  async function handleActivate() {
    const envelopeMinor = parseAmountInput(envelopeInput, DEFAULT_CURRENCY_CODE);
    const nextErrors: typeof errors = {};
    if (envelopeMinor === null) {
      nextErrors.envelope = t('ramadanScreen.errorEnvelope');
    }
    if (!ISO_DATE_PATTERN.test(startDateInput)) {
      nextErrors.startDate = t('ramadanScreen.errorStartDate');
    }
    if (!ISO_DATE_PATTERN.test(endDateInput) || endDateInput <= startDateInput) {
      nextErrors.endDate = t('ramadanScreen.errorEndDate');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || envelopeMinor === null) {
      return;
    }

    await activateRamadanTheme(getDatabase(), {
      startDate: startDateInput,
      endDate: endDateInput,
      envelopeMinor,
      currencyCode: DEFAULT_CURRENCY_CODE,
      language,
    });
    refresh();
  }

  async function handleDeactivate() {
    if (!activeTheme) return;
    await updateSeasonalTheme(getDatabase(), activeTheme.id, { active: false });
    refresh();
  }

  if (!activeTheme) {
    return (
      <AppScreen scroll background={warmBg} contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('ramadanScreen.title')} onBack={onBack} />
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <IconTile icon="moon-star" accent="gold" />
            <Txt weight="semibold" size="md" style={{ flex: 1 }}>
              {t('ramadanScreen.setupTitle')}
            </Txt>
          </View>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('ramadanScreen.setupDescription')}
          </Txt>
          <TextField
            label={t('ramadanScreen.envelopeLabel')}
            placeholder={t('ramadanScreen.envelopePlaceholder')}
            value={envelopeInput}
            onChangeText={setEnvelopeInput}
            keyboardType="decimal-pad"
            errorMessage={errors.envelope}
          />
          <TextField
            label={t('ramadanScreen.startDateLabel')}
            value={startDateInput}
            onChangeText={setStartDateInput}
            errorMessage={errors.startDate}
          />
          <TextField
            label={t('ramadanScreen.endDateLabel')}
            value={endDateInput}
            onChangeText={setEndDateInput}
            errorMessage={errors.endDate}
          />
          <Button label={t('ramadanScreen.activateButton')} onPress={handleActivate} />
        </Card>
      </AppScreen>
    );
  }

  const status = computeSeasonalThemeStatus(activeTheme, categories, transactions);
  const isNegative = status.remainingMinor < 0;

  return (
    <AppScreen scroll background={warmBg} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('ramadanScreen.title')} onBack={onBack} />

      {status.isEnded ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('ramadanScreen.recapTitle')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('ramadanScreen.recapMessage')}
          </Txt>
          <Txt size="sm">
            {t('ramadanScreen.spentLabel')}:{' '}
            {formatMoney(status.spentMinor, activeTheme.currencyCode, language)}
          </Txt>
          <Txt size="sm">
            {t('ramadanScreen.envelopeLabel')}:{' '}
            {formatMoney(activeTheme.envelopeMinor, activeTheme.currencyCode, language)}
          </Txt>
        </Card>
      ) : (
        <Card
          elevated
          style={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
        >
          <IconTile icon="moon-star" accent="gold" />
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('ramadanScreen.envelopeTitle')}
          </Txt>
          <Txt
            weight="extrabold"
            size="xxl"
            color={isNegative ? theme.colors.danger : theme.colors.textPrimary}
          >
            {formatMoney(status.remainingMinor, activeTheme.currencyCode, language)}
          </Txt>
          {isNegative ? (
            <Txt size="sm" color={theme.colors.danger}>
              {t('ramadanScreen.overspentMessage', {
                amount: formatMoney(-status.remainingMinor, activeTheme.currencyCode, language),
              })}
            </Txt>
          ) : null}
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('ramadanScreen.daysRemainingLabel', { count: status.daysRemaining })}
          </Txt>
        </Card>
      )}

      {/* US-058: "je peux choisir Aucun ou Ramadan" — available at any time while a theme is
          active, not only once the season has naturally ended. */}
      <Button
        label={t('ramadanScreen.deactivateButton')}
        variant="danger"
        onPress={handleDeactivate}
      />

      <Button
        label={t('ramadanScreen.zakatShortcut')}
        variant="secondary"
        onPress={onNavigateToZakat}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('ramadanScreen.subcategoriesTitle')} />
        {status.categorySpend.map(({ category, spentMinor }) => (
          <ListRow
            key={category.id}
            icon="utensils"
            accent="gold"
            title={resolveCategoryDisplayName(category, language)}
            value={formatMoney(spentMinor, activeTheme.currencyCode, language)}
          />
        ))}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('ramadanScreen.weeklyTitle')} />
        {status.weeklyTransactions.length === 0 ? (
          <Card elevated>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('ramadanScreen.weeklyEmpty')}
            </Txt>
          </Card>
        ) : (
          status.weeklyTransactions.map((transaction) => (
            <ListRow
              key={transaction.id}
              icon="moon-star"
              accent="gold"
              title={transaction.note || transaction.occurredAt.slice(0, 10)}
              value={formatMoney(transaction.amountMinor, transaction.currencyCode, language)}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}
