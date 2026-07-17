import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VaultDetail } from './VaultDetail';
import { VaultForm } from './VaultForm';
import {
  AppScreen,
  Button,
  Card,
  IconTile,
  Pill,
  ProgressBar,
  ScreenHeader,
  Txt,
} from '../components';
import type { AccentName } from '../theme';
import { getDatabase } from '../db/client';
import { listVaultContributions, listVaults } from '../db/repositories';
import type { Vault, VaultContribution } from '../db/repositories';
import { useLanguage } from '../i18n';
import { formatShortDate } from '../i18n/dateFormat';
import { forceLTR, toLocalizedDigits } from '../i18n/numberFormat';
import { DEFAULT_CURRENCY_CODE, formatMoney, toMajorUnits } from '../money';
import { useTheme } from '../theme';
import { computeVaultStatus } from '../vaults';

const GOAL_ACCENTS: AccentName[] = ['teal', 'gold', 'purple', 'blue', 'coral'];

export interface VaultsScreenProps {
  onBack: () => void;
}

export function VaultsScreen({ onBack }: VaultsScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [contributions, setContributions] = useState<VaultContribution[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listVaults(db).then(setVaults);
    listVaultContributions(db).then(setContributions);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const num = (minor: number, currencyCode: string) =>
    forceLTR(toLocalizedDigits(toMajorUnits(minor, currencyCode), language));

  if (view === 'form') {
    return (
      <VaultForm
        onSaved={() => {
          refresh();
          setView('list');
        }}
        onCancel={() => setView('list')}
      />
    );
  }

  if (view === 'detail' && selectedVault) {
    return (
      <VaultDetail
        vault={selectedVault}
        onBack={() => {
          setSelectedVault(null);
          setView('list');
        }}
        onVaultChanged={refresh}
        onVaultDeleted={() => {
          refresh();
          setSelectedVault(null);
          setView('list');
        }}
      />
    );
  }

  const totalSavedMinor = vaults.reduce(
    (sum, vault) => sum + computeVaultStatus(vault, contributions).savedMinor,
    0,
  );

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('vaultsScreen.title')} onBack={onBack} />
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('vaultsScreen.subtitle')}
      </Txt>

      {vaults.length > 0 ? (
        <Card
          elevated
          style={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: theme.spacing.lg }}
        >
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('vaultsScreen.totalSavedLabel')}
          </Txt>
          <Txt weight="extrabold" size="xxl">
            {formatMoney(totalSavedMinor, DEFAULT_CURRENCY_CODE, language)}
          </Txt>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t('vaultsScreen.vaultCountLabel', { count: vaults.length })}
          </Txt>
        </Card>
      ) : null}

      <Button
        label={t('vaultsScreen.addButton')}
        onPress={() => {
          setSelectedVault(null);
          setView('form');
        }}
      />

      {vaults.length === 0 ? (
        <Card elevated style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('vaultsScreen.emptyState')}
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {vaults.map((vault, index) => {
            const status = computeVaultStatus(vault, contributions);
            const accent = GOAL_ACCENTS[index % GOAL_ACCENTS.length];
            return (
              <Pressable
                key={vault.id}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedVault(vault);
                  setView('detail');
                }}
              >
                <Card elevated style={{ gap: theme.spacing.sm }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
                  >
                    <IconTile icon="piggy-bank" accent={accent} />
                    <Txt weight="semibold" size="sm" style={{ flex: 1 }}>
                      {vault.name}
                    </Txt>
                    <Pill
                      label={
                        status.isReached
                          ? t('vaultsScreen.reachedBadge')
                          : t('vaultsScreen.percentageLabel', {
                              percentage: Math.round(Math.min(100, status.percentage)),
                            })
                      }
                      background={theme.accents[accent].wash}
                      color={theme.accents[accent].ink}
                    />
                  </View>
                  <ProgressBar
                    progress={status.percentage === Infinity ? 1 : status.percentage / 100}
                    accent={accent}
                    height={6}
                  />
                  <Txt size="xs" color={theme.colors.textSecondary}>
                    {`${num(status.savedMinor, vault.currencyCode)} / ${num(status.targetMinor, vault.currencyCode)} ${vault.currencyCode}`}
                  </Txt>
                  <Txt size="xs" color={theme.colors.textSecondary}>
                    {vault.deadline
                      ? t('vaultsScreen.deadlineLabel', {
                          date: formatShortDate(new Date(`${vault.deadline}T00:00:00.000Z`), language),
                        })
                      : t('vaultsScreen.noDeadlineLabel')}
                  </Txt>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
