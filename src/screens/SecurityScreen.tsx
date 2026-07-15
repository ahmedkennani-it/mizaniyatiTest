import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, IconTile, ScreenHeader, TextField, Txt } from '../components';
import {
  biometricClient,
  disableAppLock,
  disableBiometric,
  enableBiometric,
  setPinLock,
  useAppLock,
} from '../security';
import { useTheme } from '../theme';

export interface SecurityScreenProps {
  onBack: () => void;
}

export function SecurityScreen({ onBack }: SecurityScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, refreshSettings } = useAppLock();

  const [hasHardware, setHasHardware] = useState<boolean | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [alsoEnableBiometric, setAlsoEnableBiometric] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    biometricClient.hasHardware().then(setHasHardware);
    biometricClient.isEnrolled().then(setIsEnrolled);
  }, []);

  const biometricAvailable = hasHardware === true && isEnrolled === true;

  function openPinSetup(withBiometric: boolean) {
    setPinInput('');
    setPinConfirmInput('');
    setError(undefined);
    setAlsoEnableBiometric(withBiometric);
    setShowPinSetup(true);
  }

  async function handleSavePin() {
    if (pinInput.length < 4) {
      setError(t('securityScreen.errorPinTooShort'));
      return;
    }
    if (pinInput !== pinConfirmInput) {
      setError(t('securityScreen.errorPinMismatch'));
      return;
    }
    await setPinLock(pinInput);
    if (alsoEnableBiometric) {
      await enableBiometric();
    }
    setShowPinSetup(false);
    await refreshSettings();
  }

  async function handleEnableBiometric() {
    await enableBiometric();
    await refreshSettings();
  }

  async function handleDisableBiometric() {
    await disableBiometric();
    await refreshSettings();
  }

  async function handleDisableLock() {
    await disableAppLock();
    await refreshSettings();
  }

  const currentModeLabel =
    settings.mode === 'none'
      ? t('securityScreen.modeNone')
      : settings.mode === 'pin'
        ? t('securityScreen.modePin')
        : t('securityScreen.modeBiometric');

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
      <ScreenHeader title={t('securityScreen.title')} onBack={onBack} />

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <IconTile icon="lock" accent="teal" />
        <Txt weight="semibold" size="md">
          {t('securityScreen.appLockTitle')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('securityScreen.appLockDescription')}
        </Txt>
        <Txt weight="bold" size="sm">
          {t('securityScreen.currentModeLabel', { mode: currentModeLabel })}
        </Txt>

        {showPinSetup ? (
          <>
            <Txt weight="bold" size="sm">
              {t('securityScreen.setPinTitle')}
            </Txt>
            <TextField
              label={t('securityScreen.pinLabel')}
              placeholder={t('securityScreen.pinPlaceholder')}
              value={pinInput}
              onChangeText={(value) => {
                setPinInput(value);
                setError(undefined);
              }}
              keyboardType="number-pad"
              secureTextEntry
            />
            <TextField
              label={t('securityScreen.pinConfirmLabel')}
              placeholder={t('securityScreen.pinPlaceholder')}
              value={pinConfirmInput}
              onChangeText={(value) => {
                setPinConfirmInput(value);
                setError(undefined);
              }}
              keyboardType="number-pad"
              secureTextEntry
              errorMessage={error}
            />
            <Button label={t('securityScreen.savePinButton')} onPress={handleSavePin} />
            <Button
              label={t('securityScreen.cancel')}
              variant="secondary"
              onPress={() => setShowPinSetup(false)}
            />
          </>
        ) : (
          <>
            {settings.mode === 'none' ? (
              <Button label={t('securityScreen.modePin')} onPress={() => openPinSetup(false)} />
            ) : (
              <Button
                label={t('securityScreen.setPinTitle')}
                variant="secondary"
                onPress={() => openPinSetup(settings.mode === 'biometric')}
              />
            )}

            {settings.mode === 'pin' && biometricAvailable ? (
              <Button
                label={t('securityScreen.enableBiometricButton')}
                onPress={handleEnableBiometric}
              />
            ) : null}
            {settings.mode === 'biometric' ? (
              <Button
                label={t('securityScreen.disableBiometricButton')}
                variant="secondary"
                onPress={handleDisableBiometric}
              />
            ) : null}

            {hasHardware === false ? (
              <Txt size="xs" color={theme.colors.textSecondary}>
                {t('securityScreen.biometricUnavailable')}
              </Txt>
            ) : hasHardware === true && isEnrolled === false ? (
              <Txt size="xs" color={theme.colors.textSecondary}>
                {t('securityScreen.biometricNotEnrolled')}
              </Txt>
            ) : null}

            {settings.mode !== 'none' ? (
              <Button
                label={t('securityScreen.disableLockButton')}
                variant="danger"
                onPress={handleDisableLock}
              />
            ) : null}
          </>
        )}
      </Card>

      <Card elevated style={{ gap: theme.spacing.xs }}>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('securityScreen.localOnlyNote')}
        </Txt>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {t('securityScreen.forgotPinNote')}
        </Txt>
      </Card>
    </AppScreen>
  );
}
