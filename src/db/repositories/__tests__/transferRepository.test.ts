import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import { createMember } from '../memberRepository';
import {
  createTransfer,
  deleteTransfer,
  getTransferById,
  listTransfers,
  updateTransfer,
} from '../transferRepository';

async function seedTwoMembers(db: Parameters<typeof createMember>[0]) {
  const from = await createMember(db, { name: 'Ahmed' });
  const to = await createMember(db, { name: 'Salma' });
  return { from, to };
}

describe('transferRepository', () => {
  it('creates a transfer between two members and reads it back', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);

    const transfer = await createTransfer(db, {
      amountMinor: 25000,
      currencyCode: 'MAD',
      fromMemberId: from.id,
      toMemberId: to.id,
      date: '2026-07-16',
      note: 'Argent de poche',
    });

    expect(transfer.id).toEqual(expect.any(String));
    expect(transfer.note).toBe('Argent de poche');
    expect(await getTransferById(db, transfer.id)).toEqual(transfer);
  });

  it('allows a null note', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);

    const transfer = await createTransfer(db, {
      amountMinor: 1000,
      currencyCode: 'MAD',
      fromMemberId: from.id,
      toMemberId: to.id,
      date: '2026-07-16',
    });

    expect(transfer.note).toBeNull();
  });

  it('rejects a transfer referencing an unknown member (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const from = await createMember(db, { name: 'Ahmed' });

    await expect(
      createTransfer(db, {
        amountMinor: 1000,
        currencyCode: 'MAD',
        fromMemberId: from.id,
        toMemberId: 'ghost',
        date: '2026-07-16',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('rejects a negative amount (CHECK amount_minor >= 0)', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);

    await expect(
      createTransfer(db, {
        amountMinor: -5,
        currencyCode: 'MAD',
        fromMemberId: from.id,
        toMemberId: to.id,
        date: '2026-07-16',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists transfers ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);
    const first = await createTransfer(db, {
      amountMinor: 100,
      currencyCode: 'MAD',
      fromMemberId: from.id,
      toMemberId: to.id,
      date: '2026-07-16',
    });
    const second = await createTransfer(db, {
      amountMinor: 200,
      currencyCode: 'MAD',
      fromMemberId: to.id,
      toMemberId: from.id,
      date: '2026-07-17',
    });

    const transfers = await listTransfers(db);
    expect(transfers.map((t) => t.id)).toEqual([first.id, second.id]);
  });

  it('updates a transfer amount and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);
    const transfer = await createTransfer(db, {
      amountMinor: 100,
      currencyCode: 'MAD',
      fromMemberId: from.id,
      toMemberId: to.id,
      date: '2026-07-16',
    });

    const updated = await updateTransfer(db, transfer.id, { amountMinor: 500 });

    expect(updated.amountMinor).toBe(500);
    expect(await getTransferById(db, transfer.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown transfer', async () => {
    const { db } = createFakeDatabase();
    await expect(updateTransfer(db, 'missing', { amountMinor: 1 })).rejects.toThrow(NotFoundError);
  });

  it('deletes a transfer', async () => {
    const { db } = createFakeDatabase();
    const { from, to } = await seedTwoMembers(db);
    const transfer = await createTransfer(db, {
      amountMinor: 100,
      currencyCode: 'MAD',
      fromMemberId: from.id,
      toMemberId: to.id,
      date: '2026-07-16',
    });

    await deleteTransfer(db, transfer.id);

    expect(await getTransferById(db, transfer.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown transfer', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteTransfer(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
