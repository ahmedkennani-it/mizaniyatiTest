import type { Vault, VaultContribution } from '../../db/repositories';
import { computeVaultStatus } from '../vaultStatus';

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 'vault-1',
    name: 'Omra 2027',
    targetMinor: 3000000,
    currencyCode: 'MAD',
    deadline: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeContribution(overrides: Partial<VaultContribution> = {}): VaultContribution {
  return {
    id: 'contrib-1',
    vaultId: 'vault-1',
    amountMinor: 0,
    memberId: 'member-1',
    date: '2026-07-01T00:00:00.000Z',
    note: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeVaultStatus', () => {
  it('computes percentage, remaining and suggested/month for a vault with a deadline', () => {
    const vault = makeVault({ targetMinor: 300000, deadline: '2027-01-01' });
    const contributions = [makeContribution({ amountMinor: 120000 })];

    const status = computeVaultStatus(vault, contributions, new Date('2026-07-01T00:00:00.000Z'));

    expect(status.savedMinor).toBe(120000);
    expect(status.percentage).toBeCloseTo(40);
    expect(status.remainingMinor).toBe(180000);
    expect(status.monthsRemaining).toBe(6);
    expect(status.suggestedMonthlyMinor).toBe(30000);
    expect(status.isOverdue).toBe(false);
  });

  it('sums only contributions belonging to this vault', () => {
    const vault = makeVault({ targetMinor: 300000 });
    const contributions = [
      makeContribution({ vaultId: 'vault-1', amountMinor: 50000 }),
      makeContribution({ vaultId: 'vault-1', amountMinor: 30000 }),
      makeContribution({ vaultId: 'other-vault', amountMinor: 999999 }),
    ];

    const status = computeVaultStatus(vault, contributions);

    expect(status.savedMinor).toBe(80000);
  });

  it('imposes no dated monthly suggestion on a vault without a deadline (fonds d\'urgence)', () => {
    const vault = makeVault({ targetMinor: 500000, deadline: null });

    const status = computeVaultStatus(vault, []);

    expect(status.savedMinor).toBe(0);
    expect(status.percentage).toBe(0);
    expect(status.monthsRemaining).toBeNull();
    expect(status.suggestedMonthlyMinor).toBeNull();
    expect(status.isOverdue).toBe(false);
  });

  it('recomputes correctly after a contribution is removed', () => {
    const vault = makeVault({ targetMinor: 300000 });
    const withBoth = [
      makeContribution({ id: 'c1', amountMinor: 100000 }),
      makeContribution({ id: 'c2', amountMinor: 50000 }),
    ];
    const afterDeletingC2 = withBoth.filter((c) => c.id !== 'c2');

    expect(computeVaultStatus(vault, withBoth).savedMinor).toBe(150000);
    expect(computeVaultStatus(vault, afterDeletingC2).savedMinor).toBe(100000);
  });

  it('marks the vault reached and shows the surplus once the target is exceeded', () => {
    const vault = makeVault({ targetMinor: 300000, deadline: '2027-01-01' });
    const contributions = [makeContribution({ amountMinor: 350000 })];

    const status = computeVaultStatus(vault, contributions, new Date('2026-07-01T00:00:00.000Z'));

    expect(status.isReached).toBe(true);
    expect(status.surplusMinor).toBe(50000);
    expect(status.remainingMinor).toBe(0);
    // No further suggestion is computed once the goal is met, even with a future deadline.
    expect(status.suggestedMonthlyMinor).toBeNull();
  });

  it('flags an overdue deadline and re-suggests the full remainder (cas limite)', () => {
    const vault = makeVault({ targetMinor: 300000, deadline: '2026-01-01' });
    const contributions = [makeContribution({ amountMinor: 100000 })];

    const status = computeVaultStatus(vault, contributions, new Date('2026-07-01T00:00:00.000Z'));

    expect(status.isOverdue).toBe(true);
    expect(status.suggestedMonthlyMinor).toBe(200000);
  });
});
