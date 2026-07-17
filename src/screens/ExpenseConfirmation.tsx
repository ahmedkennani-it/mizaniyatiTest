import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AlertBanner, AppScreen, Button, Card, IconTile, Txt } from '../components';
import { useLanguage } from '../i18n';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { formatLongDate } from '../i18n/dateFormat';
import { formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';

export interface ExpenseConfirmationOverBudget {
  categoryName: string;
  overageMinor: number;
}

export interface ExpenseConfirmationProps {
  amountMinor: number;
  currencyCode: string;
  categoryName: string;
  memberName: string;
  occurredAt: string;
  remainingBalanceMinor: number;
  /** Set when this operation pushed its category over its monthly cap (US-022). */
  overBudget?: ExpenseConfirmationOverBudget;
  onAddAnother: () => void;
  onDone: () => void;
}

/**
 * Shown right after a transaction is saved (US-022): a checkmark plus what was just recorded
 * (amount, category, member, date), the recalculated "reste du mois"
 * (US-011's `computeMonthlyBalance`, passed in already computed by the caller), and — when this
 * operation is what pushed the category over its cap — a warning alongside the good news.
 */
export function ExpenseConfirmation({
  amountMinor,
  currencyCode,
  categoryName,
  memberName,
  occurredAt,
  remainingBalanceMinor,
  overBudget,
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
    <AppScreen
      scroll
      contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg }}
    >
      <IconTile icon="check-circle" accent="teal" size="lg" />

      <Txt weight="bold" size="xl" style={{ textAlign: 'center' }}>
        {t('confirmation.title')}
      </Txt>

      <Card elevated style={{ gap: theme.spacing.xs, alignSelf: 'stretch' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('expenseForm.amountLabel')}
          </Txt>
          <Txt weight="semibold" size="sm">
            {formatMoney(amountMinor, currencyCode, language)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('expenseForm.categoryLabel')}
          </Txt>
          <Txt weight="semibold" size="sm">
            {categoryName}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('expenseForm.memberLabel')}
          </Txt>
          <Txt weight="semibold" size="sm">
            {memberName}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('expenseForm.dateLabel')}
          </Txt>
          <Txt weight="semibold" size="sm">
            {formatLongDate(new Date(occurredAt), language)}
          </Txt>
        </View>
      </Card>

      {overBudget ? (
        <AlertBanner
          message={t('categoriesScreen.overBanner', {
            name: overBudget.categoryName,
            amount: formatMoney(overBudget.overageMinor, currencyCode, language),
          })}
        />
      ) : null}

      <Card
        elevated
        style={{
          gap: theme.spacing.xs,
          alignItems: 'center',
          alignSelf: 'stretch',
          paddingVertical: theme.spacing.lg,
        }}
      >
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('confirmation.remainingLabel')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.xs }}>
          <Txt
            weight="extrabold"
            size={40}
            color={isNegative ? theme.colors.danger : theme.colors.textPrimary}
          >
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
