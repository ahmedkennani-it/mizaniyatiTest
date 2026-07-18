import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createDiasporaBeneficiary } from '../diasporaBeneficiaryRepository';
import { createDiasporaTransfer, listDiasporaTransfers } from '../diasporaTransferRepository';

describe('diasporaTransferRepository', () => {
  it('creates a transfer and reads it back', async () => {
    const { db } = createFakeDatabase();

    const transfer = await createDiasporaTransfer(db, {
      amountMinor: 30000,
      currencyCode: 'EUR',
      occurredAt: '2026-03-15T10:00:00.000Z',
    });

    expect(transfer.id).toEqual(expect.any(String));
    expect(transfer.amountMinor).toBe(30000);
    expect(transfer.currencyCode).toBe('EUR');
    expect(transfer.beneficiaryId).toBeNull();
    expect(transfer.method).toBe('other');
    expect(transfer.originAmountMinor).toBeNull();
    expect(transfer.rateIsManual).toBe(false);
    expect(await listDiasporaTransfers(db)).toEqual([transfer]);
  });

  it('records the method, the converted contre-valeur and whether the rate was manual', async () => {
    const { db } = createFakeDatabase();

    const transfer = await createDiasporaTransfer(db, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: '2026-03-15T10:00:00.000Z',
      method: 'wise',
      originAmountMinor: 110000,
      originCurrencyCode: 'MAD',
      rateIsManual: true,
    });

    expect(transfer.method).toBe('wise');
    expect(transfer.originAmountMinor).toBe(110000);
    expect(transfer.originCurrencyCode).toBe('MAD');
    expect(transfer.rateIsManual).toBe(true);
    expect(await listDiasporaTransfers(db)).toEqual([transfer]);
  });

  /**
   * US-064: the currency is only meaningful alongside a converted amount — a transfer with no
   * `originAmountMinor` (household already budgets in its own origin currency) never gets one
   * either, even if a caller passes one by mistake.
   */
  it('never stores an origin currency without a converted amount to go with it', async () => {
    const { db } = createFakeDatabase();

    const transfer = await createDiasporaTransfer(db, {
      amountMinor: 10000,
      currencyCode: 'MAD',
      occurredAt: '2026-03-15T10:00:00.000Z',
      originCurrencyCode: 'MAD',
    });

    expect(transfer.originAmountMinor).toBeNull();
    expect(transfer.originCurrencyCode).toBeNull();
    expect(await listDiasporaTransfers(db)).toEqual([transfer]);
  });

  it('links a transfer to a beneficiary', async () => {
    const { db } = createFakeDatabase();
    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Fatima',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });

    const transfer = await createDiasporaTransfer(db, {
      amountMinor: 30000,
      currencyCode: 'EUR',
      occurredAt: '2026-03-15T10:00:00.000Z',
      beneficiaryId: beneficiary.id,
    });

    expect(transfer.beneficiaryId).toBe(beneficiary.id);
  });

  it('rejects a transfer linked to an unknown beneficiary (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createDiasporaTransfer(db, {
        amountMinor: 30000,
        currencyCode: 'EUR',
        occurredAt: '2026-03-15T10:00:00.000Z',
        beneficiaryId: 'missing',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('lists transfers ordered by occurred_at descending', async () => {
    const { db } = createFakeDatabase();
    const earlier = await createDiasporaTransfer(db, {
      amountMinor: 10000,
      currencyCode: 'EUR',
      occurredAt: '2026-01-10T10:00:00.000Z',
    });
    const later = await createDiasporaTransfer(db, {
      amountMinor: 20000,
      currencyCode: 'EUR',
      occurredAt: '2026-06-10T10:00:00.000Z',
    });

    expect((await listDiasporaTransfers(db)).map((t) => t.id)).toEqual([later.id, earlier.id]);
  });

  it('rejects a non-positive amount (CHECK)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createDiasporaTransfer(db, {
        amountMinor: -100,
        currencyCode: 'EUR',
        occurredAt: '2026-01-10T10:00:00.000Z',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });
});
