import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
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
    expect(await listDiasporaTransfers(db)).toEqual([transfer]);
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
