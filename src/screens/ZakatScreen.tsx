import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AlertBanner,
  AppScreen,
  Button,
  Card,
  Chip,
  IconTile,
  ListRow,
  Pill,
  ScreenHeader,
  SectionHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  createTransaction,
  createZakatAssessment,
  getZakatConfig,
  listCategories,
  listHouseholds,
  listMembers,
  listZakatAssessments,
  markZakatAssessmentPaid,
  updateZakatConfig,
} from '../db/repositories';
import type {
  Category,
  Household,
  Member,
  ZakatAssessment,
  ZakatConfig,
  ZakatNisabBasis,
} from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseNonNegativeAmountInput } from '../money';
import { useTheme } from '../theme';
import { computeNisabMinor, computeZakatAssessment } from '../zakat';
import { PaywallScreen } from './PaywallScreen';

export interface ZakatScreenProps {
  onBack: () => void;
}

export function ZakatScreen({ onBack }: ZakatScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [showPaywall, setShowPaywall] = useState(false);
  const [config, setConfig] = useState<ZakatConfig | null>(null);
  const [assessments, setAssessments] = useState<ZakatAssessment[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [madhhabInput, setMadhhabInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [goldSilverInput, setGoldSilverInput] = useState('');
  const [investmentsInput, setInvestmentsInput] = useState('');
  const [debtsInput, setDebtsInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const refresh = useCallback(() => {
    const db = getDatabase();
    getZakatConfig(db).then((loaded) => {
      setConfig(loaded);
      setMadhhabInput(loaded.madhhab);
      setPriceInput(
        loaded.nisabBasis === 'gold'
          ? loaded.goldPricePerGramMinor !== null
            ? String(loaded.goldPricePerGramMinor / 100)
            : ''
          : loaded.silverPricePerGramMinor !== null
            ? String(loaded.silverPricePerGramMinor / 100)
            : '',
      );
    });
    listZakatAssessments(db).then(setAssessments);
    listHouseholds(db).then(setHouseholds);
    listCategories(db).then(setCategories);
    listMembers(db).then(setMembers);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const locked = !entitlements.can('zakat');

  // US-068: no past assessment to preserve read access to → the whole screen is the locked
  // feature, straight to the paywall. Once at least one exists it (and the calculator that
  // produced it) stays fully visible after a downgrade; only *saving a new* assessment is gated,
  // via `handleSaveAssessment` below.
  if (locked && assessments.length === 0) {
    return <PaywallScreen onBack={onBack} highlightKey="zakat" />;
  }

  if (showPaywall) {
    return <PaywallScreen onBack={() => setShowPaywall(false)} highlightKey="zakat" />;
  }

  if (!config) {
    return null;
  }
  const currentConfig = config;
  // The household's own currency, not the launch market's — a France household computes its
  // nisab and zakat in EUR, not MAD.
  const currencyCode = households[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  async function setNisabBasis(basis: ZakatNisabBasis) {
    const updated = await updateZakatConfig(getDatabase(), { nisabBasis: basis });
    setConfig(updated);
    setPriceInput(
      basis === 'gold'
        ? updated.goldPricePerGramMinor !== null
          ? String(updated.goldPricePerGramMinor / 100)
          : ''
        : updated.silverPricePerGramMinor !== null
          ? String(updated.silverPricePerGramMinor / 100)
          : '',
    );
  }

  async function handleUpdateConfig() {
    const priceMinor = parseNonNegativeAmountInput(priceInput, currencyCode);
    const updated = await updateZakatConfig(getDatabase(), {
      madhhab: madhhabInput.trim(),
      ...(currentConfig.nisabBasis === 'gold'
        ? { goldPricePerGramMinor: priceMinor }
        : { silverPricePerGramMinor: priceMinor }),
    });
    setConfig(updated);
  }

  const cashMinor = parseNonNegativeAmountInput(cashInput, currencyCode) ?? 0;
  const goldSilverMinor = parseNonNegativeAmountInput(goldSilverInput, currencyCode) ?? 0;
  const investmentsMinor = parseNonNegativeAmountInput(investmentsInput, currencyCode) ?? 0;
  const debtsMinor = parseNonNegativeAmountInput(debtsInput, currencyCode) ?? 0;

  const nisabMinor = computeNisabMinor(
    config.nisabBasis,
    config.goldPricePerGramMinor,
    config.silverPricePerGramMinor,
  );
  const result = computeZakatAssessment(
    { cashMinor, goldSilverMinor, investmentsMinor, debtsMinor },
    nisabMinor,
  );

  // Matched by icon, not name (same reasoning as the voice-dictation category matcher, US-021):
  // robust to the household having renamed its "Zakat & dons" category, and to non-MENA/Gulf
  // households that never had one seeded (US-044) and would need to create it by hand first.
  const zakatCategory = categories.find((category) => category.icon === 'hand-heart');

  async function handleSaveAssessment() {
    await createZakatAssessment(getDatabase(), {
      cashMinor,
      goldSilverMinor,
      investmentsMinor,
      debtsMinor,
      baseMinor: result.baseMinor,
      dueMinor: result.dueMinor,
      aboveNisab: result.aboveNisab,
      dueDate: dueDateInput.trim() || null,
    });
    setDueDateInput('');
    refresh();
  }

  async function handleMarkPaid(assessment: ZakatAssessment) {
    if (!zakatCategory || !members[0]) {
      return;
    }
    const db = getDatabase();
    const paidAt = new Date().toISOString();
    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: assessment.dueMinor,
      currencyCode,
      categoryId: zakatCategory.id,
      memberId: members[0].id,
      occurredAt: paidAt,
      note: t('zakatScreen.paidTransactionNote'),
    });
    await markZakatAssessmentPaid(db, assessment.id, { paidAt, transactionId: transaction.id });
    refresh();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('zakatScreen.title')} onBack={onBack} />

      <AlertBanner tone="info" icon="shield-check" message={t('zakatScreen.disclaimer')} />

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('zakatScreen.configTitle')}
        </Txt>
        <TextField
          label={t('zakatScreen.madhhabLabel')}
          placeholder={t('zakatScreen.madhhabPlaceholder')}
          value={madhhabInput}
          onChangeText={setMadhhabInput}
        />
        <View style={{ gap: theme.spacing.xs }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('zakatScreen.nisabBasisLabel')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Chip
              label={t('zakatScreen.nisabBasisGold')}
              selected={config.nisabBasis === 'gold'}
              onPress={() => setNisabBasis('gold')}
            />
            <Chip
              label={t('zakatScreen.nisabBasisSilver')}
              selected={config.nisabBasis === 'silver'}
              onPress={() => setNisabBasis('silver')}
            />
          </View>
        </View>
        <TextField
          label={
            config.nisabBasis === 'gold'
              ? t('zakatScreen.goldPriceLabel')
              : t('zakatScreen.silverPriceLabel')
          }
          placeholder={t('zakatScreen.pricePlaceholder')}
          value={priceInput}
          onChangeText={setPriceInput}
          keyboardType="decimal-pad"
        />
        <Txt size="xs" color={theme.colors.textSecondary}>
          {config.priceUpdatedAt
            ? t('zakatScreen.priceUpdatedLabel', { date: config.priceUpdatedAt.slice(0, 10) })
            : t('zakatScreen.priceNeverUpdated')}
        </Txt>
        <Button
          label={t('zakatScreen.updateConfig')}
          variant="secondary"
          onPress={handleUpdateConfig}
        />
      </Card>

      <Card elevated style={{ gap: theme.spacing.xs }}>
        <Txt weight="semibold" size="md">
          {t('zakatScreen.nisabTitle')}
        </Txt>
        {nisabMinor === null ? (
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('zakatScreen.nisabUnavailable')}
          </Txt>
        ) : (
          <Txt weight="bold" size="lg">
            {formatMoney(nisabMinor, currencyCode, language)}
          </Txt>
        )}
      </Card>

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('zakatScreen.assetsTitle')}
        </Txt>
        <TextField
          label={t('zakatScreen.cashLabel')}
          placeholder={t('zakatScreen.amountPlaceholder')}
          value={cashInput}
          onChangeText={setCashInput}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('zakatScreen.goldSilverLabel')}
          placeholder={t('zakatScreen.amountPlaceholder')}
          value={goldSilverInput}
          onChangeText={setGoldSilverInput}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('zakatScreen.investmentsLabel')}
          placeholder={t('zakatScreen.amountPlaceholder')}
          value={investmentsInput}
          onChangeText={setInvestmentsInput}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('zakatScreen.debtsLabel')}
          placeholder={t('zakatScreen.amountPlaceholder')}
          value={debtsInput}
          onChangeText={setDebtsInput}
          keyboardType="decimal-pad"
        />
      </Card>

      <Card
        elevated
        style={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
      >
        <IconTile icon="hand-heart" accent="gold" />
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('zakatScreen.dueLabel')}
        </Txt>
        <Txt weight="extrabold" size="xxl">
          {formatMoney(result.dueMinor, currencyCode, language)}
        </Txt>
        <Txt size="sm">
          {t('zakatScreen.baseLabel')}: {formatMoney(result.baseMinor, currencyCode, language)}
        </Txt>
        {nisabMinor !== null ? (
          <Pill
            label={
              result.aboveNisab
                ? t('zakatScreen.aboveNisabMessage')
                : t('zakatScreen.belowNisabMessage')
            }
            background={result.aboveNisab ? theme.accents.gold.wash : theme.colors.surfaceAlt}
            color={result.aboveNisab ? theme.accents.gold.ink : theme.colors.textSecondary}
          />
        ) : null}
        <TextField
          label={t('zakatScreen.dueDateLabel')}
          placeholder={t('zakatScreen.dueDatePlaceholder')}
          value={dueDateInput}
          onChangeText={setDueDateInput}
        />
        <Button
          label={t('zakatScreen.saveButton')}
          onPress={() => (locked ? setShowPaywall(true) : handleSaveAssessment())}
        />
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={t('zakatScreen.historyTitle')} />
        {assessments.length === 0 ? (
          <Card elevated>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('zakatScreen.historyEmpty')}
            </Txt>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <ListRow
              key={assessment.id}
              icon="hand-heart"
              accent="gold"
              title={assessment.createdAt.slice(0, 10)}
              subtitle={
                assessment.dueDate
                  ? t('zakatScreen.dueDateSubtitle', { date: assessment.dueDate })
                  : undefined
              }
              trailing={
                <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
                  <Txt weight="semibold" size="sm">
                    {formatMoney(assessment.dueMinor, currencyCode, language)}
                  </Txt>
                  {assessment.paidAt ? (
                    <Pill
                      label={t('zakatScreen.paidLabel')}
                      background={theme.accents.gold.wash}
                      color={theme.accents.gold.ink}
                    />
                  ) : (
                    <Button
                      label={t('zakatScreen.markPaidButton')}
                      variant="secondary"
                      onPress={() => handleMarkPaid(assessment)}
                    />
                  )}
                </View>
              }
            />
          ))
        )}
        {!zakatCategory ? (
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t('zakatScreen.noZakatCategoryNote')}
          </Txt>
        ) : null}
      </View>
    </AppScreen>
  );
}
