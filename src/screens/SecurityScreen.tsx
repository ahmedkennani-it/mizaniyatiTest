import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertBanner,
  AppScreen,
  Button,
  Card,
  IconTile,
  ScreenHeader,
  TextField,
  Txt,
} from '../components';
import {
  BackupNotEnabledError,
  InvalidBackupFileError,
  WrongRecoveryKeyError,
  appReloadClient,
  backupFileClient,
  disableBackup,
  enableBackup,
  exportBackup,
  getBackupSettings,
  restoreBackup,
} from '../backup';
import type { BackupSettings } from '../backup';
import { getDatabase } from '../db/client';
import { useLanguage } from '../i18n';
import { formatLongDate } from '../i18n/dateFormat';
import {
  biometricClient,
  disableAppLock,
  disableBiometric,
  enableBiometric,
  setPinLock,
  useAppLock,
  verifyPin,
} from '../security';
import { useTheme } from '../theme';

export interface SecurityScreenProps {
  onBack: () => void;
}

export function SecurityScreen({ onBack }: SecurityScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { settings, refreshSettings } = useAppLock();

  const [hasHardware, setHasHardware] = useState<boolean | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [alsoEnableBiometric, setAlsoEnableBiometric] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [showBackupSetup, setShowBackupSetup] = useState(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [recoveryKeyConfirmInput, setRecoveryKeyConfirmInput] = useState('');
  const [backupSetupError, setBackupSetupError] = useState<string | undefined>(undefined);
  const [showExportPrompt, setShowExportPrompt] = useState(false);
  const [exportKeyInput, setExportKeyInput] = useState('');
  const [exportError, setExportError] = useState<string | undefined>(undefined);
  const [exportMessage, setExportMessage] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restorePinInput, setRestorePinInput] = useState('');
  const [restoreKeyInput, setRestoreKeyInput] = useState('');
  const [restoreError, setRestoreError] = useState<string | undefined>(undefined);
  const [restoreMessage, setRestoreMessage] = useState<string | undefined>(undefined);
  const [restoring, setRestoring] = useState(false);

  const refreshBackupSettings = useCallback(() => {
    getBackupSettings().then(setBackupSettings);
  }, []);

  useEffect(() => {
    biometricClient.hasHardware().then(setHasHardware);
    biometricClient.isEnrolled().then(setIsEnrolled);
    refreshBackupSettings();
  }, [refreshBackupSettings]);

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

  function openBackupSetup() {
    setRecoveryKeyInput('');
    setRecoveryKeyConfirmInput('');
    setBackupSetupError(undefined);
    setShowBackupSetup(true);
  }

  async function handleEnableBackup() {
    if (recoveryKeyInput.length < 8) {
      setBackupSetupError(t('backupScreen.errorRecoveryKeyTooShort'));
      return;
    }
    if (recoveryKeyInput !== recoveryKeyConfirmInput) {
      setBackupSetupError(t('backupScreen.errorRecoveryKeyMismatch'));
      return;
    }
    await enableBackup(recoveryKeyInput);
    setShowBackupSetup(false);
    await refreshBackupSettings();
  }

  async function handleDisableBackup() {
    // US-071a's 3rd criterion: disabling deletes any backup the app still keeps locally, on top of
    // forgetting the recovery key (`disableBackup`) — nothing "distant" to delete, see `progress.md`.
    await backupFileClient.deleteLocalBackup();
    await disableBackup();
    await refreshBackupSettings();
  }

  function openExportPrompt() {
    setExportKeyInput('');
    setExportError(undefined);
    setExportMessage(undefined);
    setShowExportPrompt(true);
  }

  async function handleExport() {
    setExportError(undefined);
    setExporting(true);
    try {
      await exportBackup(getDatabase(), exportKeyInput);
      setShowExportPrompt(false);
      setExportMessage(t('backupScreen.exportSuccessMessage'));
      await refreshBackupSettings();
    } catch (exportErr) {
      setExportError(
        exportErr instanceof WrongRecoveryKeyError
          ? t('backupScreen.errorWrongRecoveryKey')
          : exportErr instanceof BackupNotEnabledError
            ? t('backupScreen.errorNotEnabled')
            : t('backupScreen.errorExportFailed'),
      );
    } finally {
      setExporting(false);
    }
  }

  function openRestorePrompt() {
    setRestorePinInput('');
    setRestoreKeyInput('');
    setRestoreError(undefined);
    setRestoreMessage(undefined);
    setShowRestorePrompt(true);
  }

  async function handleRestore() {
    setRestoreError(undefined);
    // US-071b's 1st criterion — there's no account/login in this app, so the closest available
    // authentication is the device's own app-lock, when one is configured; the recovery key
    // re-typed just below (required either way to decrypt) is what stands in for it on a device
    // that never had a PIN set — the scenario the criterion's own "appareil vierge" describes.
    if (settings.mode !== 'none') {
      const pinOk = await verifyPin(restorePinInput, settings);
      if (!pinOk) {
        setRestoreError(t('backupScreen.errorWrongPin'));
        return;
      }
    }

    setRestoring(true);
    try {
      const content = await backupFileClient.pickBackupFile();
      if (content === null) {
        return;
      }
      await restoreBackup(getDatabase(), content, restoreKeyInput);
      setShowRestorePrompt(false);
      try {
        await appReloadClient.reload();
      } catch {
        setRestoreMessage(t('backupScreen.restoreSuccessRestartNote'));
      }
    } catch (restoreErr) {
      setRestoreError(
        restoreErr instanceof WrongRecoveryKeyError
          ? t('backupScreen.errorWrongRecoveryKey')
          : restoreErr instanceof InvalidBackupFileError
            ? t('backupScreen.errorInvalidFile')
            : t('backupScreen.errorRestoreFailed'),
      );
    } finally {
      setRestoring(false);
    }
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

      {backupSettings ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <IconTile icon="shield-check" accent="purple" />
          <Txt weight="semibold" size="md">
            {t('backupScreen.title')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('backupScreen.description')}
          </Txt>

          {!backupSettings.enabled ? (
            !showBackupSetup ? (
              <Button label={t('backupScreen.enableButton')} onPress={openBackupSetup} />
            ) : (
              <>
                <TextField
                  label={t('backupScreen.recoveryKeyLabel')}
                  placeholder={t('backupScreen.recoveryKeyPlaceholder')}
                  value={recoveryKeyInput}
                  onChangeText={(value) => {
                    setRecoveryKeyInput(value);
                    setBackupSetupError(undefined);
                  }}
                  secureTextEntry
                />
                <TextField
                  label={t('backupScreen.recoveryKeyConfirmLabel')}
                  placeholder={t('backupScreen.recoveryKeyPlaceholder')}
                  value={recoveryKeyConfirmInput}
                  onChangeText={(value) => {
                    setRecoveryKeyConfirmInput(value);
                    setBackupSetupError(undefined);
                  }}
                  secureTextEntry
                  errorMessage={backupSetupError}
                />
                <AlertBanner
                  tone="warning"
                  icon="alert-triangle"
                  message={t('backupScreen.recoveryKeyWarning')}
                />
                <Button label={t('backupScreen.confirmEnableButton')} onPress={handleEnableBackup} />
                <Button
                  label={t('securityScreen.cancel')}
                  variant="secondary"
                  onPress={() => setShowBackupSetup(false)}
                />
              </>
            )
          ) : (
            <>
              <Txt size="xs" color={theme.colors.textSecondary}>
                {backupSettings.lastBackupAt
                  ? t('backupScreen.lastBackupLabel', {
                      date: formatLongDate(new Date(backupSettings.lastBackupAt), language),
                    })
                  : t('backupScreen.neverBackedUpLabel')}
              </Txt>

              {!showExportPrompt ? (
                <Button label={t('backupScreen.exportButton')} onPress={openExportPrompt} />
              ) : (
                <>
                  <TextField
                    label={t('backupScreen.recoveryKeyLabel')}
                    placeholder={t('backupScreen.recoveryKeyPlaceholder')}
                    value={exportKeyInput}
                    onChangeText={(value) => {
                      setExportKeyInput(value);
                      setExportError(undefined);
                    }}
                    secureTextEntry
                    errorMessage={exportError}
                  />
                  <Button
                    label={t('backupScreen.confirmExportButton')}
                    onPress={handleExport}
                    disabled={exporting}
                  />
                  <Button
                    label={t('securityScreen.cancel')}
                    variant="secondary"
                    onPress={() => setShowExportPrompt(false)}
                  />
                </>
              )}

              {exportMessage ? (
                <Txt size="xs" color={theme.colors.textSecondary}>
                  {exportMessage}
                </Txt>
              ) : null}

              <Button
                label={t('backupScreen.disableButton')}
                variant="danger"
                onPress={handleDisableBackup}
              />
            </>
          )}

          {/* US-071b: available regardless of whether *this* device has backup enabled — a
              freshly onboarded device starts disabled by default (US-071a's 1st criterion) and is
              exactly the "appareil vierge" this restores onto. */}
          <Txt weight="semibold" size="sm">
            {t('backupScreen.restoreTitle')}
          </Txt>
          {!showRestorePrompt ? (
            <Button
              label={t('backupScreen.restoreButton')}
              variant="secondary"
              onPress={openRestorePrompt}
            />
          ) : (
            <>
              {settings.mode !== 'none' ? (
                <TextField
                  label={t('securityScreen.pinLabel')}
                  placeholder={t('securityScreen.pinPlaceholder')}
                  value={restorePinInput}
                  onChangeText={(value) => {
                    setRestorePinInput(value);
                    setRestoreError(undefined);
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              ) : null}
              <TextField
                label={t('backupScreen.recoveryKeyLabel')}
                placeholder={t('backupScreen.recoveryKeyPlaceholder')}
                value={restoreKeyInput}
                onChangeText={(value) => {
                  setRestoreKeyInput(value);
                  setRestoreError(undefined);
                }}
                secureTextEntry
                errorMessage={restoreError}
              />
              <AlertBanner
                tone="warning"
                icon="alert-triangle"
                message={t('backupScreen.restoreWarning')}
              />
              <Button
                label={t('backupScreen.confirmRestoreButton')}
                onPress={handleRestore}
                disabled={restoring}
              />
              <Button
                label={t('securityScreen.cancel')}
                variant="secondary"
                onPress={() => setShowRestorePrompt(false)}
              />
            </>
          )}

          {restoreMessage ? (
            <Txt size="xs" color={theme.colors.textSecondary}>
              {restoreMessage}
            </Txt>
          ) : null}
        </Card>
      ) : null}

      <Card elevated style={{ gap: theme.spacing.sm }}>
        <IconTile icon="shield-check" accent="teal" />
        <Txt weight="semibold" size="md">
          {t('storage.title')}
        </Txt>
        <Txt size="sm" color={theme.colors.textSecondary}>
          {t('storage.description')}
        </Txt>
      </Card>

      <AlertBanner
        tone="warning"
        icon="alert-triangle"
        title={t('storage.uninstallWarningTitle')}
        message={t('storage.uninstallWarning')}
      />

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
