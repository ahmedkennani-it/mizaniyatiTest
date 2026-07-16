import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Avatar, Button, Icon, ListRow, TrustChip, Txt } from '../components';
import { ensureAppReady, getDatabase, saveLanguageCountry } from '../db';
import { useLanguage } from '../i18n';
import { DEFAULT_COUNTRY_CODE, SUPPORTED_COUNTRIES } from '../onboarding';
import { useTheme } from '../theme';

export interface OnboardingLanguageCountryScreenProps {
  /** Called once the choice is persisted and the chosen language's defaults have been seeded. */
  onComplete: () => void;
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

  const [selectedCountryCode, setSelectedCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [saving, setSaving] = useState(false);

  const selectedCountry =
    SUPPORTED_COUNTRIES.find((country) => country.code === selectedCountryCode) ??
    SUPPORTED_COUNTRIES[0];

  async function handleContinue() {
    setSaving(true);
    await saveLanguageCountry(getDatabase(), {
      languageCode: language,
      countryCode: selectedCountry.code,
      currencyCode: selectedCountry.currencyCode,
    });
    // Default categories/member are seeded here (in the just-chosen language), not earlier at
    // app mount — seeding before the user picks a language would lock in the device-detected one.
    await ensureAppReady(language);
    onComplete();
  }

  const languages: { code: 'fr' | 'ar'; label: string }[] = [
    { code: 'fr', label: t('language.french') },
    { code: 'ar', label: t('language.arabic') },
  ];

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
      {languages.map((lang) => {
        const active = language === lang.code;
        return (
          <ListRow
            key={lang.code}
            leading={<Avatar name={lang.label} size={38} accent={active ? 'teal' : 'purple'} />}
            title={lang.label}
            trailing={
              active ? (
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              ) : undefined
            }
            onPress={() => setLanguage(lang.code)}
            style={selectedBorder(active)}
          />
        );
      })}

      {/* Country / market */}
      <Txt weight="semibold" size="md">
        {t('onboarding.countryLabel')}
      </Txt>
      {SUPPORTED_COUNTRIES.map((country) => {
        const active = selectedCountryCode === country.code;
        return (
          <ListRow
            key={country.code}
            icon="map-pin"
            accent="gold"
            title={t(country.nameKey)}
            subtitle={t('onboarding.currencyNote', { currency: country.currencyCode })}
            trailing={
              active ? (
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              ) : undefined
            }
            onPress={() => setSelectedCountryCode(country.code)}
            style={selectedBorder(active)}
          />
        );
      })}

      <Button label={t('onboarding.continueButton')} onPress={handleContinue} disabled={saving} />
    </AppScreen>
  );
}
