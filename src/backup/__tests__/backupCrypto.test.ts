import { decryptWithKey, deriveBackupKey, encryptWithKey } from '../backupCrypto';

describe('deriveBackupKey (US-071a)', () => {
  it('is deterministic: same passphrase + salt always yields the same key', () => {
    const a = deriveBackupKey('correct horse battery staple', 'deadbeef');
    const b = deriveBackupKey('correct horse battery staple', 'deadbeef');
    expect(a).toBe(b);
  });

  it('differs for a different passphrase', () => {
    const a = deriveBackupKey('correct horse battery staple', 'deadbeef');
    const b = deriveBackupKey('wrong passphrase', 'deadbeef');
    expect(a).not.toBe(b);
  });

  it('differs for a different salt', () => {
    const a = deriveBackupKey('correct horse battery staple', 'deadbeef');
    const b = deriveBackupKey('correct horse battery staple', 'cafef00d');
    expect(a).not.toBe(b);
  });
});

describe('encryptWithKey / decryptWithKey round trip (US-071a/US-071b)', () => {
  it('decrypts back to the original plaintext with the right key', () => {
    const key = deriveBackupKey('correct horse battery staple', 'deadbeef');
    const plaintext = JSON.stringify({ households: [{ id: '1', name: 'Famille Benali' }] });

    const encrypted = encryptWithKey(plaintext, key);

    expect(decryptWithKey(encrypted, key)).toBe(plaintext);
  });

  it('never produces the same ciphertext twice for the same plaintext (fresh IV each time)', () => {
    const key = deriveBackupKey('correct horse battery staple', 'deadbeef');

    const first = encryptWithKey('hello', key);
    const second = encryptWithKey('hello', key);

    expect(first).not.toBe(second);
  });

  it('never recovers the original plaintext with the wrong key (throws, or returns garbage)', () => {
    const rightKey = deriveBackupKey('correct horse battery staple', 'deadbeef');
    const wrongKey = deriveBackupKey('some other passphrase', 'deadbeef');
    const plaintext = 'sensitive household data';

    const encrypted = encryptWithKey(plaintext, rightKey);

    let result: string | Error;
    try {
      result = decryptWithKey(encrypted, wrongKey);
    } catch (error) {
      result = error as Error;
    }
    expect(result).not.toBe(plaintext);
  });

  it('rejects a malformed payload instead of silently returning garbage', () => {
    const key = deriveBackupKey('correct horse battery staple', 'deadbeef');
    expect(() => decryptWithKey('not-a-valid-payload', key)).toThrow();
  });
});
