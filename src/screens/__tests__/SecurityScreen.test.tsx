import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('../../security/appLockSettings', () => ({
  getAppLockSettings: jest.fn(),
  setPinLock: jest.fn(),
  enableBiometric: jest.fn(),
  disableBiometric: jest.fn(),
  disableAppLock: jest.fn(),
  verifyPin: jest.fn(),
}));

jest.mock('../../security/biometricClient', () => ({
  biometricClient: { hasHardware: jest.fn(), isEnrolled: jest.fn(), authenticate: jest.fn() },
}));

jest.mock('../../backup', () => ({
  getBackupSettings: jest.fn(),
  enableBackup: jest.fn(),
  disableBackup: jest.fn(),
  exportBackup: jest.fn(),
  restoreBackup: jest.fn(),
  backupFileClient: {
    deleteLocalBackup: jest.fn().mockResolvedValue(undefined),
    pickBackupFile: jest.fn(),
  },
  appReloadClient: { reload: jest.fn() },
  BackupNotEnabledError: class BackupNotEnabledError extends Error {},
  WrongRecoveryKeyError: class WrongRecoveryKeyError extends Error {},
  InvalidBackupFileError: class InvalidBackupFileError extends Error {},
}));

// `exportBackup` itself is mocked above and never touches its `db` argument — this only exists so
// `getDatabase()` doesn't reach for the real (unavailable under Jest) SQLite native module.
jest.mock('../../db/client', () => ({
  getDatabase: () => ({}),
}));

// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import {
  disableAppLock,
  disableBiometric,
  enableBiometric,
  getAppLockSettings,
  setPinLock,
  verifyPin,
} from '../../security/appLockSettings';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { biometricClient } from '../../security/biometricClient';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { AppLockProvider } from '../../security';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
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
} from '../../backup';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after the jest.mock(...) calls above
import { SecurityScreen } from '../SecurityScreen';

const mockGetAppLockSettings = getAppLockSettings as jest.Mock;
const mockSetPinLock = setPinLock as jest.Mock;
const mockEnableBiometric = enableBiometric as jest.Mock;
const mockDisableBiometric = disableBiometric as jest.Mock;
const mockDisableAppLock = disableAppLock as jest.Mock;
const mockHasHardware = biometricClient.hasHardware as jest.Mock;
const mockIsEnrolled = biometricClient.isEnrolled as jest.Mock;
const mockGetBackupSettings = getBackupSettings as jest.Mock;
const mockEnableBackup = enableBackup as jest.Mock;
const mockDisableBackup = disableBackup as jest.Mock;
const mockExportBackup = exportBackup as jest.Mock;
const mockRestoreBackup = restoreBackup as jest.Mock;
const mockPickBackupFile = backupFileClient.pickBackupFile as jest.Mock;
const mockReload = appReloadClient.reload as jest.Mock;
const mockVerifyPin = verifyPin as jest.Mock;

const DEFAULT_BACKUP_SETTINGS = {
  enabled: false,
  recoveryKeySalt: null,
  recoveryKeyHash: null,
  lastBackupAt: null,
};

function renderScreen(onBack: () => void = jest.fn()) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <AppLockProvider>
          <SecurityScreen onBack={onBack} />
        </AppLockProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('SecurityScreen (US-028)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppLockSettings.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
    mockGetBackupSettings.mockResolvedValue(DEFAULT_BACKUP_SETTINGS);
  });

  it('shows "no lock" as the current mode by default', async () => {
    await renderScreen();

    expect(await screen.findByText('Verrou actuel : Aucun verrou')).toBeTruthy();
  });

  it('sets a PIN and switches the current mode', async () => {
    mockSetPinLock.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockGetAppLockSettings
      .mockResolvedValueOnce({ mode: 'none', pinHash: null, pinSalt: null })
      .mockResolvedValueOnce({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '1234');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '1234');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(mockSetPinLock).toHaveBeenCalledWith('1234');
    expect(await screen.findByText('Verrou actuel : Code PIN')).toBeTruthy();
  });

  it('rejects a too-short PIN', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '12');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '12');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(await screen.findByText('Le code PIN doit contenir au moins 4 chiffres.')).toBeTruthy();
    expect(mockSetPinLock).not.toHaveBeenCalled();
  });

  it('rejects mismatched PIN confirmation', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Code PIN'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '1234');
    await fireEvent.changeText(screen.getByLabelText('Confirmez le code PIN'), '9999');
    await fireEvent.press(screen.getByText('Enregistrer le code PIN'));

    expect(await screen.findByText('Les deux codes PIN ne correspondent pas.')).toBeTruthy();
    expect(mockSetPinLock).not.toHaveBeenCalled();
  });

  it('offers to enable biometric once a PIN is set and hardware is available', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();

    expect(await screen.findByText('Activer aussi la biométrie')).toBeTruthy();
  });

  it('does not offer biometric when no hardware is available', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockHasHardware.mockResolvedValue(false);

    await renderScreen();

    expect(await screen.findByText('Aucune biométrie disponible sur cet appareil.')).toBeTruthy();
    expect(screen.queryByText('Activer aussi la biométrie')).toBeNull();
  });

  it('enables biometric on top of the existing PIN', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockEnableBiometric.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Activer aussi la biométrie'));

    expect(mockEnableBiometric).toHaveBeenCalledTimes(1);
  });

  it('disables biometric, dropping back to pin mode', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'biometric', pinHash: 'h', pinSalt: 's' });
    mockDisableBiometric.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Désactiver la biométrie'));

    expect(mockDisableBiometric).toHaveBeenCalledTimes(1);
  });

  it('disables the lock entirely', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockDisableAppLock.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Désactiver le verrou'));

    expect(mockDisableAppLock).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when the header back button is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    await fireEvent.press(screen.getByLabelText('Retour'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('SecurityScreen — sauvegarde chiffrée (US-071a)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppLockSettings.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
    mockGetBackupSettings.mockResolvedValue(DEFAULT_BACKUP_SETTINGS);
  });

  it('starts disabled, offering only an "enable" button', async () => {
    await renderScreen();

    expect(await screen.findByText('Activer la sauvegarde')).toBeTruthy();
    expect(screen.queryByText('Exporter maintenant')).toBeNull();
  });

  it('rejects a too-short recovery key', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Activer la sauvegarde'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'short');
    await fireEvent.changeText(screen.getByLabelText('Confirmez la clé de récupération'), 'short');
    await fireEvent.press(screen.getByText('Activer'));

    expect(
      await screen.findByText('La clé de récupération doit contenir au moins 8 caractères.'),
    ).toBeTruthy();
    expect(mockEnableBackup).not.toHaveBeenCalled();
  });

  it('rejects a mismatched recovery key confirmation', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Activer la sauvegarde'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.changeText(
      screen.getByLabelText('Confirmez la clé de récupération'),
      'something else entirely',
    );
    await fireEvent.press(screen.getByText('Activer'));

    expect(await screen.findByText('Les deux clés ne correspondent pas.')).toBeTruthy();
    expect(mockEnableBackup).not.toHaveBeenCalled();
  });

  it('enables backup with a valid recovery key', async () => {
    mockEnableBackup.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });
    mockGetBackupSettings
      .mockResolvedValueOnce(DEFAULT_BACKUP_SETTINGS)
      .mockResolvedValueOnce({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Activer la sauvegarde'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.changeText(
      screen.getByLabelText('Confirmez la clé de récupération'),
      'correct horse battery',
    );
    await fireEvent.press(screen.getByText('Activer'));

    expect(mockEnableBackup).toHaveBeenCalledWith('correct horse battery');
    expect(await screen.findByText('Exporter maintenant')).toBeTruthy();
  });

  it('shows when no backup has ever been exported', async () => {
    mockGetBackupSettings.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });

    await renderScreen();

    expect(await screen.findByText('Aucune sauvegarde exportée pour le moment.')).toBeTruthy();
  });

  /** US-071b's 2nd criterion: the last successful backup date is shown in settings. */
  it('shows the last successful backup date once one exists', async () => {
    mockGetBackupSettings.mockResolvedValue({
      ...DEFAULT_BACKUP_SETTINGS,
      enabled: true,
      lastBackupAt: '2026-07-15T10:00:00.000Z',
    });

    await renderScreen();

    expect(await screen.findByText(/Dernière sauvegarde réussie/)).toBeTruthy();
  });

  it('exports with the recovery key and shows a success message', async () => {
    mockGetBackupSettings.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });
    mockExportBackup.mockResolvedValue({
      uri: 'file:///backups/mizaniyati-backup.mzb',
      settings: { ...DEFAULT_BACKUP_SETTINGS, enabled: true, lastBackupAt: '2026-07-15T10:00:00.000Z' },
    });

    await renderScreen();
    await fireEvent.press(await screen.findByText('Exporter maintenant'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.press(screen.getByText('Chiffrer et exporter'));

    expect(await screen.findByText('Sauvegarde exportée et chiffrée avec succès.')).toBeTruthy();
    expect(mockExportBackup).toHaveBeenCalledWith(expect.anything(), 'correct horse battery');
  });

  it('shows a friendly error on the wrong recovery key, without crashing', async () => {
    mockGetBackupSettings.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });
    mockExportBackup.mockRejectedValue(new WrongRecoveryKeyError());

    await renderScreen();
    await fireEvent.press(await screen.findByText('Exporter maintenant'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'wrong key');
    await fireEvent.press(screen.getByText('Chiffrer et exporter'));

    expect(await screen.findByText('Clé de récupération incorrecte.')).toBeTruthy();
  });

  it('shows a friendly error when backup is not enabled, without crashing', async () => {
    mockGetBackupSettings.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });
    mockExportBackup.mockRejectedValue(new BackupNotEnabledError());

    await renderScreen();
    await fireEvent.press(await screen.findByText('Exporter maintenant'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'anything');
    await fireEvent.press(screen.getByText('Chiffrer et exporter'));

    expect(await screen.findByText("La sauvegarde n'est pas activée.")).toBeTruthy();
  });

  /** US-071a's 3rd criterion: disabling clears the backup state and deletes any local copy. */
  it('disables backup and deletes the locally kept copy', async () => {
    mockGetBackupSettings.mockResolvedValue({ ...DEFAULT_BACKUP_SETTINGS, enabled: true });
    mockDisableBackup.mockResolvedValue(DEFAULT_BACKUP_SETTINGS);

    await renderScreen();
    await fireEvent.press(await screen.findByText('Désactiver la sauvegarde'));

    expect(mockDisableBackup).toHaveBeenCalledTimes(1);
    expect(backupFileClient.deleteLocalBackup).toHaveBeenCalledTimes(1);
  });
});

describe('SecurityScreen — restauration d’une sauvegarde (US-071b)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppLockSettings.mockResolvedValue({ mode: 'none', pinHash: null, pinSalt: null });
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
    // A device that has never enabled backup itself is exactly the "appareil vierge" scenario —
    // the restore action must still be offered.
    mockGetBackupSettings.mockResolvedValue(DEFAULT_BACKUP_SETTINGS);
  });

  it('offers restore even when this device has never enabled backup', async () => {
    await renderScreen();

    expect(await screen.findByText('Restaurer depuis un fichier')).toBeTruthy();
  });

  it('does not prompt for a PIN when no app lock is configured', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));

    expect(screen.queryByLabelText('Code PIN (4 chiffres ou plus)')).toBeNull();
    expect(await screen.findByText('Clé de récupération')).toBeTruthy();
  });

  it('restores from a picked file with the recovery key and reloads the app', async () => {
    mockPickBackupFile.mockResolvedValue('{"version":1,"salt":"x","ciphertext":"y"}');
    mockRestoreBackup.mockResolvedValue({
      households: 1,
      members: 1,
      categories: 1,
      transactions: 1,
      vaults: 1,
      vaultContributions: 1,
    });
    mockReload.mockResolvedValue(undefined);

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    // The prompt closes (back to the plain "Restaurer" button) once the restore succeeds.
    expect(await screen.findByText('Restaurer depuis un fichier')).toBeTruthy();
    expect(mockPickBackupFile).toHaveBeenCalledTimes(1);
    expect(mockRestoreBackup).toHaveBeenCalledWith(
      expect.anything(),
      '{"version":1,"salt":"x","ciphertext":"y"}',
      'correct horse battery',
    );
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the file picker is cancelled', async () => {
    mockPickBackupFile.mockResolvedValue(null);

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    expect(await screen.findByText('Choisir un fichier et restaurer')).toBeTruthy();
    expect(mockRestoreBackup).not.toHaveBeenCalled();
  });

  it('shows a friendly error on the wrong recovery key, without crashing', async () => {
    mockPickBackupFile.mockResolvedValue('{"version":1,"salt":"x","ciphertext":"y"}');
    mockRestoreBackup.mockRejectedValue(new WrongRecoveryKeyError());

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'wrong key');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    expect(await screen.findByText('Clé de récupération incorrecte.')).toBeTruthy();
  });

  it('shows a friendly error on an invalid backup file, without crashing', async () => {
    mockPickBackupFile.mockResolvedValue('not a backup');
    mockRestoreBackup.mockRejectedValue(new InvalidBackupFileError());

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'anything');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    expect(
      await screen.findByText("Ce fichier n'est pas une sauvegarde Mizaniyati valide."),
    ).toBeTruthy();
  });

  /** US-071b's 1st criterion: when a PIN is set, restoring requires it. */
  it('requires the correct PIN before restoring when an app lock is configured', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockVerifyPin.mockResolvedValue(false);

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '0000');
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    expect(await screen.findByText('Code PIN incorrect.')).toBeTruthy();
    expect(mockPickBackupFile).not.toHaveBeenCalled();
  });

  it('proceeds once the correct PIN is entered', async () => {
    mockGetAppLockSettings.mockResolvedValue({ mode: 'pin', pinHash: 'h', pinSalt: 's' });
    mockVerifyPin.mockResolvedValue(true);
    mockPickBackupFile.mockResolvedValue(null);

    await renderScreen();
    await fireEvent.press(await screen.findByText('Restaurer depuis un fichier'));
    await fireEvent.changeText(screen.getByLabelText('Code PIN (4 chiffres ou plus)'), '1234');
    await fireEvent.changeText(screen.getByLabelText('Clé de récupération'), 'correct horse battery');
    await fireEvent.press(screen.getByText('Choisir un fichier et restaurer'));

    expect(await screen.findByText('Choisir un fichier et restaurer')).toBeTruthy();
    expect(mockPickBackupFile).toHaveBeenCalledTimes(1);
  });
});
