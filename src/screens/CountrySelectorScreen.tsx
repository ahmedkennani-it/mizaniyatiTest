import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { reconcileMarketCategories } from '../categories';
import { AppScreen, Button, Card, Icon, ListRow, Pill, ScreenHeader, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { getUserSettings, listHouseholds, saveLanguageCountry, updateHousehold } from '../db/repositories';
import type { Household, UserSettings } from '../db/repositories';
import { useLanguage } from '../i18n';
import { DEFAULT_COUNTRY_CODE, MARKETS, isMenaGulfMarket } from '../market';
import type { Market } from '../market';
import { formatMoney } from '../money';
import { useTheme } from '../theme';

export interface CountrySelectorScreenProps {
  onBack: () => void;
}

/** A representative amount, purely to preview how money reads in a given currency (US-057). */
const EXAMPLE_AMOUNT_MINOR = 123456;

function matchesQuery(market: Market, query: string, translatedName: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') {
    return true;
  }
  return (
    translatedName.toLowerCase().includes(normalized) ||
    market.currencyCode.toLowerCase().includes(normalized) ||
    market.code.toLowerCase().includes(normalized)
  );
}

/**
 * "Sélecteur de pays & devise avec recherche" (US-057) — search + region grouping over the full
 * `MARKETS` registry (not just `SELECTABLE_MARKETS`): a household should be able to see where the
 * app is going, same "named but not selectable" convention as the onboarding step and the language
 * packs. Only a `selectable` market can actually be chosen; the rest render inert with a "Bientôt
 * disponible" badge instead of a chevron.
 */
export function CountrySelectorScreen({ onBack }: CountrySelectorScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [query, setQuery] = useState('');
  const [pendingMarket, setPendingMarket] = useState<Market | null>(null);

  const refresh = useCallback(() => {
    const db = getDatabase();
    listHouseholds(db).then(setHouseholds);
    getUserSettings(db).then(setSettings);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentCountryCode = settings?.countryCode ?? DEFAULT_COUNTRY_CODE;
  const currentMarket = MARKETS.find((market) => market.code === currentCountryCode) ?? MARKETS[0];
  const currentCurrencyCode = households[0]?.currencyCode ?? currentMarket.currencyCode;

  const { menaGulf, diaspora } = useMemo(() => {
    const groups: { menaGulf: Market[]; diaspora: Market[] } = { menaGulf: [], diaspora: [] };
    for (const market of MARKETS) {
      if (market.code === currentCountryCode) {
        continue; // shown separately, highlighted at the top (US-057's own wording).
      }
      const translatedName = t(market.nameKey);
      if (!matchesQuery(market, query, translatedName)) {
        continue;
      }
      (isMenaGulfMarket(market.code) ? groups.menaGulf : groups.diaspora).push(market);
    }
    return groups;
  }, [query, currentCountryCode, t]);

  async function handleConfirmChange() {
    if (!pendingMarket) {
      return;
    }
    const db = getDatabase();
    await saveLanguageCountry(db, {
      languageCode: language,
      countryCode: pendingMarket.code,
      currencyCode: pendingMarket.currencyCode,
    });
    if (households[0]) {
      await updateHousehold(db, households[0].id, { currencyCode: pendingMarket.currencyCode });
    }
    // US-063: the new market's modules/categories are reproposed — never deletes or renames
    // anything the household already entered, only adds whatever's missing (e.g. a household
    // moving from Morocco to France gains "Transfert famille" without losing its own categories).
    await reconcileMarketCategories(db, language, pendingMarket.code);
    setPendingMarket(null);
    refresh();
  }

  function marketRow(market: Market) {
    return (
      <ListRow
        key={market.code}
        icon="map-pin"
        accent="gold"
        title={t(market.nameKey)}
        subtitle={market.currencyCode}
        trailing={
          market.selectable ? undefined : (
            <Pill
              label={t('countrySelector.comingSoonBadge')}
              background={theme.colors.surfaceAlt}
              color={theme.colors.textSecondary}
            />
          )
        }
        chevron={market.selectable}
        onPress={market.selectable ? () => setPendingMarket(market) : undefined}
      />
    );
  }

  if (pendingMarket) {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('countrySelector.confirmTitle')} onBack={() => setPendingMarket(null)} />
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt size="sm">
            {t('countrySelector.confirmMessage', {
              oldCurrency: currentCurrencyCode,
              newCurrency: pendingMarket.currencyCode,
            })}
          </Txt>
          <Txt size="sm" weight="semibold">
            {t('countrySelector.exampleAmountLabel', {
              amount: formatMoney(EXAMPLE_AMOUNT_MINOR, pendingMarket.currencyCode, language),
            })}
          </Txt>
        </Card>
        <Button label={t('countrySelector.confirmYes')} onPress={handleConfirmChange} />
        <Button
          label={t('countrySelector.confirmCancel')}
          variant="secondary"
          onPress={() => setPendingMarket(null)}
        />
      </AppScreen>
    );
  }

  const noResults = menaGulf.length === 0 && diaspora.length === 0 && query.trim() !== '';

  return (
    <AppScreen scroll bottomInset={110} contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('countrySelector.title')} onBack={onBack} />

      <TextField
        label={t('countrySelector.searchLabel')}
        placeholder={t('countrySelector.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('countrySelector.selectedTitle')}
        </Txt>
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            borderWidth: 2,
            borderColor: theme.colors.primary,
          }}
        >
          <Icon name="map-pin" size={22} color={theme.colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight="semibold" size="sm">
              {t(currentMarket.nameKey)}
            </Txt>
            <Txt size="xs" color={theme.colors.textSecondary}>
              {t('countrySelector.exampleAmountLabel', {
                amount: formatMoney(EXAMPLE_AMOUNT_MINOR, currentCurrencyCode, language),
              })}
            </Txt>
          </View>
          <Pill
            label={currentCurrencyCode}
            background={theme.accents.teal.wash}
            color={theme.accents.teal.ink}
          />
        </Card>
      </View>

      {noResults ? (
        <Card elevated>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('countrySelector.noResults')}
          </Txt>
        </Card>
      ) : (
        <>
          {menaGulf.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Txt weight="semibold" size="md">
                {t('countrySelector.regionMenaGulf')}
              </Txt>
              {menaGulf.map(marketRow)}
            </View>
          ) : null}

          {diaspora.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Txt weight="semibold" size="md">
                {t('countrySelector.regionDiaspora')}
              </Txt>
              {diaspora.map(marketRow)}
            </View>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
