import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Avatar, Button, Icon, ListRow, TrustChip, Txt } from '../components';
import { ensureAppReady, getDatabase, saveLanguageCountry } from '../db';
import { LANGUAGE_OPTIONS, useLanguage } from '../i18n';
import { ANNOUNCED_MARKETS, SELECTABLE_MARKETS } from '../market';
import type { Market } from '../market';
import { useTheme } from '../theme';

export interface OnboardingLanguageCountryScreenProps {
  /**
   * Called once the choice is persisted and the chosen language's defaults have been seeded, with
   * the chosen market — the next step needs its currency for the household budget.
   */
  onComplete: (market: Market) => void;
}

/**
 * First (and, until US-024/US-025 land, only) onboarding screen: "Bienvenue" + "Langue & pays"
 * from `docs/specs/onboarding-confidentialite.md`'s sequence. `App.tsx` renders this instead of
 * `RootNavigator` whenever `getUserSettings` returns `null` (no completed onboarding yet).
 * Choosing a country only sets its currency today (Morocco → MAD) — there's nothing else to pick
 * since MVP launch is Morocco-only (`docs/PRD.md` §4). Picking a language calls `setLanguage`
 * immediately (same as `ProfileScreen`) so the whole screen — including RTL mirroring and this
 * screen's own copy — previews the choice live, rather than only applying it once "Continuer" is
 * pressed.
 */
export function OnboardingLanguageCountryScreen({
  onComplete,
}: OnboardingLanguageCountryScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();

  // Starts empty on purpose: US-003 wants "Continuer" disabled until the market is an explicit
  // choice. Pre-selecting the only market today would make the country silently assumed, and the
  // country is what decides the currency and the local modules.
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCountry = SELECTABLE_MARKETS.find((market) => market.code === selectedCountryCode);

  async function handleContinue() {
    if (!selectedCountry) {
      return;
    }
    setSaving(true);
    await saveLanguageCountry(getDatabase(), {
      languageCode: language,
      countryCode: selectedCountry.code,
      currencyCode: selectedCountry.currencyCode,
    });
    // Default categories/member are seeded here (in the just-chosen language), not earlier at
    // app mount — seeding before the user picks a language would lock in the device-detected one.
    // The country decides whether the MENA/Gulf "Zakat & dons" default is part of that set
    // (US-044).
    await ensureAppReady(language, selectedCountry.code);
    onComplete(selectedCountry);
  }

  function selectedBorder(active: boolean) {
    return active ? { borderWidth: 2, borderColor: theme.colors.primary } : undefined;
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      {/* Brand hero */}
      <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingTop: theme.spacing.lg }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: theme.accents.teal.solid,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt weight="bold" size={30} color={theme.onAccent.text}>
            م
          </Txt>
        </View>
        <Txt weight="extrabold" size="xl" style={{ textAlign: 'center' }}>
          {t('onboarding.welcomeTitle')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
          {t('onboarding.welcomeSubtitle')}
        </Txt>
        <TrustChip label={t('home.disclaimer')} />
      </View>

      {/* Language */}
      <Txt weight="semibold" size="md">
        {t('onboarding.languageLabel')}
      </Txt>
      {LANGUAGE_OPTIONS.map((option) => {
        const active = language === option.code;
        const nativeName = t(option.nativeNameKey);
        return (
          <ListRow
            key={option.code}
            leading={<Avatar name={nativeName} size={38} accent={active ? 'teal' : 'purple'} />}
            title={nativeName}
            subtitle={t(option.translatedNameKey)}
            trailing={
              active ? (
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              ) : undefined
            }
            onPress={() => setLanguage(option.code)}
            style={selectedBorder(active)}
          />
        );
      })}

      {/* Named but not selectable: US-002 wants the roadmap visible without implying it ships. */}
      <Txt size="xs" color={theme.colors.textSecondary}>
        {t('language.additionalPacks')}
      </Txt>

      {/* Country / market */}
      <Txt weight="semibold" size="md">
        {t('onboarding.countryLabel')}
      </Txt>
      {SELECTABLE_MARKETS.map((market) => {
        const active = selectedCountryCode === market.code;
        return (
          <ListRow
            key={market.code}
            icon="map-pin"
            accent="gold"
            title={t(market.nameKey)}
            subtitle={t('onboarding.currencyNote', { currency: market.currencyCode })}
            trailing={
              active ? (
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              ) : undefined
            }
            onPress={() => setSelectedCountryCode(market.code)}
            style={selectedBorder(active)}
          />
        );
      })}

      {/* Named but not selectable, like the language packs: says where the app is going without
          implying these markets work yet. */}
      <Txt size="xs" color={theme.colors.textSecondary}>
        {t('onboarding.otherMarketsNote', {
          markets: ANNOUNCED_MARKETS.map((market) => market.currencyCode).join(', '),
        })}
      </Txt>

      <Button
        label={t('onboarding.continueButton')}
        onPress={handleContinue}
        disabled={saving || selectedCountry === undefined}
      />
    </AppScreen>
  );
}
