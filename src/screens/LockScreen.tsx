import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, IconTile, TextField, Txt } from '../components';
import { useAppLock } from '../security';
import { useTheme } from '../theme';

/**
 * Shown instead of the app when `useAppLock().locked` is `true` (`App.tsx`). Biometric mode
 * tries Face/Touch ID first (auto-prompted once `settings` has loaded) and always offers a PIN
 * fallback — "Échec biométrie → repli PIN" (`docs/specs/securite-sauvegarde.md`'s cas limite).
 */
export function LockScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, unlockWithPin, unlockWithBiometric } = useAppLock();

  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [biometricFailed, setBiometricFailed] = useState(false);
  const [pinRequestedManually, setPinRequestedManually] = useState(false);
  // A guard flag, not display state — a ref avoids the extra render `useState` would trigger.
  const biometricAttempted = useRef(false);

  useEffect(() => {
    if (settings.mode !== 'biometric' || biometricAttempted.current) {
      return;
    }
    biometricAttempted.current = true;
    unlockWithBiometric(t('lockScreen.biometricPrompt')).then((ok) => {
      if (!ok) {
        setBiometricFailed(true);
      }
    });
  }, [settings.mode, unlockWithBiometric, t]);

  const showPinField = settings.mode === 'pin' || biometricFailed || pinRequestedManually;

  async function handleUnlockWithPin() {
    const ok = await unlockWithPin(pinInput);
    if (!ok) {
      setError(t('lockScreen.errorIncorrectPin'));
    }
  }

  async function handleRetryBiometric() {
    const ok = await unlockWithBiometric(t('lockScreen.biometricPrompt'));
    if (!ok) {
      setBiometricFailed(true);
    }
  }

  return (
    <AppScreen contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg }}>
      <IconTile icon="lock" accent="teal" size="lg" />

      <Txt weight="bold" size="xl" style={{ textAlign: 'center' }}>
        {t('lockScreen.title')}
      </Txt>

      {settings.mode === 'biometric' && !showPinField ? (
        <View style={{ width: '100%', alignItems: 'center', gap: theme.spacing.md }}>
          <Button label={t('lockScreen.useBiometricButton')} onPress={handleRetryBiometric} style={{ alignSelf: 'stretch' }} />
          <Pressable accessibilityRole="button" onPress={() => setPinRequestedManually(true)}>
            <Txt weight="bold" size="sm" color={theme.colors.primary}>
              {t('lockScreen.usePinInsteadButton')}
            </Txt>
          </Pressable>
        </View>
      ) : (
        <View style={{ width: '100%', gap: theme.spacing.sm }}>
          <TextField
            label={t('lockScreen.pinLabel')}
            placeholder={t('lockScreen.pinPlaceholder')}
            value={pinInput}
            onChangeText={(value) => {
              setPinInput(value);
              setError(undefined);
            }}
            keyboardType="number-pad"
            secureTextEntry
            errorMessage={error}
          />
          <Button label={t('lockScreen.unlockButton')} onPress={handleUnlockWithPin} />
        </View>
      )}
    </AppScreen>
  );
}
