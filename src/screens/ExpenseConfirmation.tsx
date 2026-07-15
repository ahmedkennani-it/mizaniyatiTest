import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, IconTile, Txt } from '../components';
import { useLanguage } from '../i18n';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';

export interface ExpenseConfirmationProps {
  remainingBalanceMinor: number;
  currencyCode: string;
  onAddAnother: () => void;
  onDone: () => void;
}

/**
 * Shown right after a transaction is saved (US-012): confirms the save and shows the recalculated
 * "reste du mois" (US-011's `computeMonthlyBalance`, passed in already computed by the caller).
 */
export function ExpenseConfirmation({
  remainingBalanceMinor,
  currencyCode,
  onAddAnother,
  onDone,
}: ExpenseConfirmationProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const isNegative = remainingBalanceMinor < 0;
  const major = toMajorUnits(Math.abs(remainingBalanceMinor), currencyCode);
  const amountText = forceLTR(`${isNegative ? '-' : ''}${toLocalizedDigits(major, language)}`);

  return (
    <AppScreen contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg }}>
      <IconTile icon="check-circle" accent="teal" size="lg" />

      <Txt weight="bold" size="xl" style={{ textAlign: 'center' }}>
        {t('confirmation.title')}
      </Txt>

      <Card elevated style={{ gap: theme.spacing.xs, alignItems: 'center', alignSelf: 'stretch', paddingVertical: theme.spacing.lg }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('confirmation.remainingLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.xs }}>
          <Txt weight="extrabold" size={40} color={isNegative ? theme.colors.danger : theme.colors.textPrimary}>
            {amountText}
          </Txt>
          <Txt weight="semibold" size="md" color={theme.colors.textSecondary}>
            {currencyCode}
          </Txt>
        </View>
        {/* Keep the fully-formatted amount available for callers/tests that assert on it. */}
        <Txt size="xs" color={theme.colors.textSecondary}>
          {formatMoney(remainingBalanceMinor, currencyCode, language)}
        </Txt>
      </Card>

      <View style={{ alignSelf: 'stretch', gap: theme.spacing.sm }}>
        <Button label={t('confirmation.addAnother')} onPress={onAddAnother} />
        <Button label={t('confirmation.backHome')} variant="secondary" onPress={onDone} />
      </View>
    </AppScreen>
  );
}
