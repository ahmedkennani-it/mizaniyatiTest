import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import {
  createDebt,
  deleteDebt,
  getDebtById,
  listDebts,
  markDebtReminded,
  updateDebt,
} from '../debtRepository';
import { NotFoundError } from '../errors';

describe('debtRepository', () => {
  it('creates a debt owed to the household and reads it back', async () => {
    const { db } = createFakeDatabase();

    const debt = await createDebt(db, {
      label: 'Prêt à Youssef',
      counterparty: 'Youssef',
      direction: 'owed_to_household',
      amountMinor: 50000,
      currencyCode: 'MAD',
      date: '2026-08-01',
      dueDate: '2026-09-01',
    });

    expect(debt.id).toEqual(expect.any(String));
    expect(debt.direction).toBe('owed_to_household');
    expect(debt.date).toBe('2026-08-01');
    expect(debt.dueDate).toBe('2026-09-01');
    expect(debt.settled).toBe(false);
    expect(debt.remindedAt).toBeNull();
    expect(await getDebtById(db, debt.id)).toEqual(debt);
  });

  it('defaults settled to false and allows a null due date', async () => {
    const { db } = createFakeDatabase();

    const debt = await createDebt(db, {
      label: 'Dette épicerie',
      counterparty: 'Épicerie du coin',
      direction: 'household_owes',
      amountMinor: 12000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    expect(debt.dueDate).toBeNull();
    expect(debt.settled).toBe(false);
  });

  it('rejects a negative amount (CHECK amount_minor >= 0)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createDebt(db, {
        label: 'X',
        counterparty: 'Y',
        direction: 'household_owes',
        amountMinor: -1,
        currencyCode: 'MAD',
        date: '2026-03-01',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists debts ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const first = await createDebt(db, {
      label: 'A',
      counterparty: 'A',
      direction: 'household_owes',
      amountMinor: 100,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });
    const second = await createDebt(db, {
      label: 'B',
      counterparty: 'B',
      direction: 'owed_to_household',
      amountMinor: 200,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    const debts = await listDebts(db);
    expect(debts.map((d) => d.id)).toEqual([first.id, second.id]);
  });

  it('marks a debt as settled', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    const updated = await updateDebt(db, debt.id, { settled: true });

    expect(updated.settled).toBe(true);
    expect(await getDebtById(db, debt.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown debt', async () => {
    const { db } = createFakeDatabase();
    await expect(updateDebt(db, 'missing', { settled: true })).rejects.toThrow(NotFoundError);
  });

  it('marks a debt reminded without touching its other fields', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
      dueDate: '2026-04-01',
    });

    const updated = await markDebtReminded(db, debt.id, '2026-04-01T09:00:00.000Z');

    expect(updated.remindedAt).toBe('2026-04-01T09:00:00.000Z');
    expect(updated.amountMinor).toBe(30000);
    expect(await getDebtById(db, debt.id)).toEqual(updated);
  });

  it('throws NotFoundError when marking an unknown debt reminded', async () => {
    const { db } = createFakeDatabase();
    await expect(markDebtReminded(db, 'missing', '2026-04-01T09:00:00.000Z')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deletes a debt', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    await deleteDebt(db, debt.id);

    expect(await getDebtById(db, debt.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown debt', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteDebt(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
