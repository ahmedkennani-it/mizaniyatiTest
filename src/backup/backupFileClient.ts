import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKUP_FILE_NAME = 'mizaniyati-backup.mzb';

/**
 * Narrow interface over `expo-file-system`/`expo-sharing` — same testability-by-narrowing pattern
 * as `secureStoreClient.ts`/`biometricClient.ts`. The app keeps one working copy of the latest
 * export in its own sandbox (`Paths.document`) so "Exporter" always has something to hand to the
 * OS share sheet and "Désactiver" has something concrete to delete (US-071a's 3rd criterion) —
 * this is *not* a remote store, `.uri` never leaves the device on its own; only `share()` (an
 * explicit household action) hands it to the OS, which may then save/send it anywhere.
 */
export interface BackupFileClient {
  writeLocalBackup(content: string): Promise<string>;
  share(uri: string): Promise<void>;
  deleteLocalBackup(): Promise<void>;
  /** US-071b: opens the OS document picker; `null` if the household cancels. */
  pickBackupFile(): Promise<string | null>;
}

export const backupFileClient: BackupFileClient = {
  async writeLocalBackup(content) {
    const file = new File(Paths.document, BACKUP_FILE_NAME);
    file.write(content);
    return file.uri;
  },
  async share(uri) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  },
  async deleteLocalBackup() {
    const file = new File(Paths.document, BACKUP_FILE_NAME);
    if (file.exists) {
      file.delete();
    }
  },
  async pickBackupFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) {
      return null;
    }
    const file = new File(result.assets[0].uri);
    return file.text();
  },
};
