import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RecurringRuleForm } from './RecurringRuleForm';
import {
  AppScreen,
  Button,
  Card,
  ListRow,
  ScreenHeader,
  SectionHeader,
  TextField,
  Txt,
} from '../components';
import { getDatabase } from '../db/client';
import { createTransaction, listRecurringRules, updateRecurringRule } from '../db/repositories';
import type { RecurringRule } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput, toMajorUnits } from '../money';
import { computeDueOccurrenceDates } from '../recurring';
import { useTheme } from '../theme';

interface PendingProposal {
  rule: RecurringRule;
  dueDate: string;
}

function proposalKey(proposal: PendingProposal): string {
  return `${proposal.rule.id}:${proposal.dueDate}`;
}

const WEEKDAY_KEYS = [
  'weekdaySunday',
  'weekdayMonday',
  'weekdayTuesday',
  'weekdayWednesday',
  'weekdayThursday',
  'weekdayFriday',
  'weekdaySaturday',
] as const;

export interface RecurringRulesScreenProps {
  onBack: () => void;
}

export function RecurringRulesScreen({ onBack }: RecurringRulesScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [proposalAmounts, setProposalAmounts] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    listRecurringRules(getDatabase()).then(setRules);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // "Given une règle mensuelle en mode proposition, When l'échéance arrive, Then l'app propose la
  // transaction pré-remplie à confirmer/modifier/ignorer" — recomputed on every render from the
  // already-loaded rules rather than persisted, same no-cache pattern as
  // computeMonthlyBalance/computeCategoryBudgetStatus. `lastRunDate` only advances once a proposal
  // is actually resolved (see handleConfirmProposal/handleIgnoreProposal), so nothing here mutates
  // the DB — safe to recompute on every render.
  const pendingProposals: PendingProposal[] = rules
    .filter((rule) => rule.mode === 'prompt' && !rule.paused)
    .flatMap((rule) =>
      computeDueOccurrenceDates(rule, new Date()).map((dueDate) => ({ rule, dueDate })),
    );

  function proposalAmountInput(proposal: PendingProposal): string {
    const key = proposalKey(proposal);
    return (
      proposalAmounts[key] ??
      String(toMajorUnits(proposal.rule.amountMinor, proposal.rule.currencyCode))
    );
  }

  async function handleConfirmProposal(proposal: PendingProposal) {
    const db = getDatabase();
    const amountMinor =
      parseAmountInput(proposalAmountInput(proposal), proposal.rule.currencyCode) ??
      proposal.rule.amountMinor;
    await createTransaction(db, {
      type: proposal.rule.type,
      amountMinor,
      currencyCode: proposal.rule.currencyCode,
      categoryId: proposal.rule.categoryId,
      memberId: proposal.rule.memberId,
      occurredAt: `${proposal.dueDate}T09:00:00.000Z`,
      note: proposal.rule.note,
    });
    await updateRecurringRule(db, proposal.rule.id, { lastRunDate: proposal.dueDate });
    refresh();
  }

  async function handleIgnoreProposal(proposal: PendingProposal) {
    await updateRecurringRule(getDatabase(), proposal.rule.id, { lastRunDate: proposal.dueDate });
    refresh();
  }

  if (view === 'form') {
    return (
      <RecurringRuleForm
        rule={editingRule ?? undefined}
        onSaved={() => {
          refresh();
          setEditingRule(null);
          setView('list');
        }}
        onCancel={() => {
          setEditingRule(null);
          setView('list');
        }}
        onDeleted={() => {
          refresh();
          setEditingRule(null);
          setView('list');
        }}
      />
    );
  }

  function frequencyLabel(rule: RecurringRule): string {
    if (rule.frequency === 'monthly') {
      return t('recurringRulesScreen.frequencyMonthlyLabel', { day: rule.dayOfMonth ?? 1 });
    }
    const weekdayKey = WEEKDAY_KEYS[rule.weekday ?? 0];
    return t('recurringRulesScreen.frequencyWeeklyLabel', {
      weekday: t(`recurringForm.${weekdayKey}`),
    });
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('recurringRulesScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('recurringRulesScreen.subtitle')}
      </Txt>

      <Button
        label={t('recurringRulesScreen.addButton')}
        onPress={() => {
          setEditingRule(null);
          setView('form');
        }}
      />

      {pendingProposals.length > 0 ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('recurringRulesScreen.pendingTitle')}
          </Txt>
          {pendingProposals.map((proposal) => {
            const key = proposalKey(proposal);
            return (
              <View key={key} style={{ gap: theme.spacing.xs }}>
                <Txt weight="medium" size="sm">
                  {proposal.rule.note || frequencyLabel(proposal.rule)}
                </Txt>
                <Txt size="xs" color={theme.colors.textSecondary}>
                  {t('recurringRulesScreen.pendingDueLabel', { date: proposal.dueDate })}
                </Txt>
                <TextField
                  label={t('recurringRulesScreen.pendingAmountLabel')}
                  value={proposalAmountInput(proposal)}
                  onChangeText={(text) =>
                    setProposalAmounts((current) => ({ ...current, [key]: text }))
                  }
                  keyboardType="decimal-pad"
                />
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                  <Button
                    label={t('recurringRulesScreen.pendingConfirm')}
                    style={{ flex: 1 }}
                    onPress={() => handleConfirmProposal(proposal)}
                  />
                  <Button
                    label={t('recurringRulesScreen.pendingIgnore')}
                    variant="secondary"
                    style={{ flex: 1 }}
                    onPress={() => handleIgnoreProposal(proposal)}
                  />
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}

      {rules.length === 0 ? (
        <Card elevated>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('recurringRulesScreen.emptyState')}
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('recurringRulesScreen.title')} />
          {rules.map((rule) => (
            <ListRow
              key={rule.id}
              icon="calendar-clock"
              accent={rule.paused ? 'coral' : 'teal'}
              title={rule.note || frequencyLabel(rule)}
              subtitle={`${frequencyLabel(rule)} · ${
                rule.mode === 'auto'
                  ? t('recurringRulesScreen.modeAutoLabel')
                  : t('recurringRulesScreen.modePromptLabel')
              }${rule.paused ? ` · ${t('recurringRulesScreen.pausedLabel')}` : ''}`}
              value={formatMoney(
                rule.amountMinor,
                rule.currencyCode ?? DEFAULT_CURRENCY_CODE,
                language,
              )}
              onPress={() => {
                setEditingRule(rule);
                setView('form');
              }}
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}
