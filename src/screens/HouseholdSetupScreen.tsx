import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AlertBanner, AppScreen, Button, TextField, Txt } from '../components';
import { getDatabase } from '../db/client';
import { setupHousehold } from '../household';
import { useTheme } from '../theme';

export interface HouseholdSetupScreenProps {
  /** Currency of the market chosen at the previous step — the household budget's own currency. */
  currencyCode: string;
  onCreated: () => void;
}

/**
 * Names the household and the person onboarding (US-005). Both are needed before the dashboard:
 * the greeting is by first name, and the budget belongs to a named family, not to "Moi".
 */
export function HouseholdSetupScreen({ currencyCode, onCreated }: HouseholdSetupScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; householdName?: string }>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const nextErrors: typeof errors = {};
    if (firstName.trim() === '') {
      nextErrors.firstName = t('household.errorFirstName');
    }
    if (householdName.trim() === '') {
      nextErrors.householdName = t('household.errorName');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    await setupHousehold(getDatabase(), {
      firstName: firstName.trim(),
      householdName: householdName.trim(),
      currencyCode,
    });
    onCreated();
  }

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <View style={{ gap: theme.spacing.xs, paddingTop: theme.spacing.md }}>
        <Txt weight="extrabold" size="xl">
          {t('household.title')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('household.subtitle')}
        </Txt>
      </View>

      <TextField
        label={t('household.firstNameLabel')}
        placeholder={t('household.firstNamePlaceholder')}
        value={firstName}
        onChangeText={(value) => {
          setFirstName(value);
          setErrors((previous) => ({ ...previous, firstName: undefined }));
        }}
        errorMessage={errors.firstName}
      />

      <TextField
        label={t('household.nameLabel')}
        placeholder={t('household.namePlaceholder')}
        value={householdName}
        onChangeText={(value) => {
          setHouseholdName(value);
          setErrors((previous) => ({ ...previous, householdName: undefined }));
        }}
        errorMessage={errors.householdName}
      />

      <AlertBanner tone="info" icon="shield-check" message={t('household.adminNote')} />

      <Button label={t('household.submit')} size="lg" onPress={handleSubmit} disabled={saving} />
    </AppScreen>
  );
}
