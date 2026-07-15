import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AlertBanner,
  AppScreen,
  Button,
  Card,
  Chip,
  ListRow,
  ScreenHeader,
  SectionHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import {
  createZakatAssessment,
  getZakatConfig,
  listZakatAssessments,
  updateZakatConfig,
} from '../db/repositories';
import type { ZakatAssessment, ZakatConfig, ZakatNisabBasis } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseNonNegativeAmountInput } from '../money';
import { useTheme } from '../theme';
import { computeNisabMinor, computeZakatAssessment } from '../zakat';

export interface ZakatScreenProps {
  onBack: () => void;
}

export function ZakatScreen({ onBack }: ZakatScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [config, setConfig] = useState<ZakatConfig | null>(null);
  const [assessments, setAssessments] = useState<ZakatAssessment[]>([]);

  const [madhhabInput, setMadhhabInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [goldSilverInput, setGoldSilverInput] = useState('');
  const [investmentsInput, setInvestmentsInput] = useState('');
  const [debtsInput, setDebtsInput] = useState('');

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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entitlements.can('zakat')) {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('zakatScreen.title')} onBack={onBack} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('zakatScreen.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('zakatScreen.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  if (!config) {
    return null;
  }
  const currentConfig = config;

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
    const priceMinor = parseNonNegativeAmountInput(priceInput, DEFAULT_CURRENCY_CODE);
    const updated = await updateZakatConfig(getDatabase(), {
      madhhab: madhhabInput.trim(),
      ...(currentConfig.nisabBasis === 'gold'
        ? { goldPricePerGramMinor: priceMinor }
        : { silverPricePerGramMinor: priceMinor }),
    });
    setConfig(updated);
  }

  const cashMinor = parseNonNegativeAmountInput(cashInput, DEFAULT_CURRENCY_CODE) ?? 0;
  const goldSilverMinor = parseNonNegativeAmountInput(goldSilverInput, DEFAULT_CURRENCY_CODE) ?? 0;
  const investmentsMinor =
    parseNonNegativeAmountInput(investmentsInput, DEFAULT_CURRENCY_CODE) ?? 0;
  const debtsMinor = parseNonNegativeAmountInput(debtsInput, DEFAULT_CURRENCY_CODE) ?? 0;

  const nisabMinor = computeNisabMinor(
    config.nisabBasis,
    config.goldPricePerGramMinor,
    config.silverPricePerGramMinor,
  );
  const result = computeZakatAssessment(
    { cashMinor, goldSilverMinor, investmentsMinor, debtsMinor },
    nisabMinor,
  );

  async function handleSaveAssessment() {
    await createZakatAssessment(getDatabase(), {
      cashMinor,
      goldSilverMinor,
      investmentsMinor,
      debtsMinor,
      baseMinor: result.baseMinor,
      dueMinor: result.dueMinor,
      aboveNisab: result.aboveNisab,
    });
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
            {formatMoney(nisabMinor, DEFAULT_CURRENCY_CODE, language)}
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

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <Txt weight="semibold" size="md">
          {t('zakatScreen.resultTitle')}
        </Txt>
        <Txt size="sm">
          {t('zakatScreen.baseLabel')}:{' '}
          {formatMoney(result.baseMinor, DEFAULT_CURRENCY_CODE, language)}
        </Txt>
        <Txt weight="bold" size="md">
          {t('zakatScreen.dueLabel')}:{' '}
          {formatMoney(result.dueMinor, DEFAULT_CURRENCY_CODE, language)}
        </Txt>
        {nisabMinor !== null ? (
          <Txt
            size="sm"
            color={result.aboveNisab ? theme.colors.primary : theme.colors.textSecondary}
          >
            {result.aboveNisab
              ? t('zakatScreen.aboveNisabMessage')
              : t('zakatScreen.belowNisabMessage')}
          </Txt>
        ) : null}
        <Button label={t('zakatScreen.saveButton')} onPress={handleSaveAssessment} />
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
              value={formatMoney(assessment.dueMinor, DEFAULT_CURRENCY_CODE, language)}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}
