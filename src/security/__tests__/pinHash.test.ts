jest.mock('../cryptoClient', () => ({
  cryptoClient: {
    digestSha256Hex: jest.fn((value: string) => Promise.resolve(`digest(${value})`)),
    randomHex: jest.fn(() => Promise.resolve('deadbeef')),
  },
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../cryptoClient', ...) above
import { cryptoClient } from '../cryptoClient';
// eslint-disable-next-line import/first -- must come after jest.mock('../cryptoClient', ...) above
import { generateSalt, hashPin } from '../pinHash';

describe('generateSalt', () => {
  it('delegates to cryptoClient.randomHex', async () => {
    const salt = await generateSalt();
    expect(salt).toBe('deadbeef');
    expect(cryptoClient.randomHex).toHaveBeenCalledWith(16);
  });
});

describe('hashPin', () => {
  it('hashes the salt and pin together', async () => {
    const hash = await hashPin('1234', 'somesalt');
    expect(hash).toBe('digest(somesalt:1234)');
  });

  it('produces a different hash for a different salt (same pin)', async () => {
    const hashA = await hashPin('1234', 'saltA');
    const hashB = await hashPin('1234', 'saltB');
    expect(hashA).not.toBe(hashB);
  });
});
