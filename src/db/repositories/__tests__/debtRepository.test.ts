import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createDebt, deleteDebt, getDebtById, listDebts, updateDebt } from '../debtRepository';
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
      dueDate: '2026-09-01',
    });

    expect(debt.id).toEqual(expect.any(String));
    expect(debt.direction).toBe('owed_to_household');
    expect(debt.dueDate).toBe('2026-09-01');
    expect(debt.settled).toBe(false);
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
    });
    const second = await createDebt(db, {
      label: 'B',
      counterparty: 'B',
      direction: 'owed_to_household',
      amountMinor: 200,
      currencyCode: 'MAD',
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
    });

    const updated = await updateDebt(db, debt.id, { settled: true });

    expect(updated.settled).toBe(true);
    expect(await getDebtById(db, debt.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown debt', async () => {
    const { db } = createFakeDatabase();
    await expect(updateDebt(db, 'missing', { settled: true })).rejects.toThrow(NotFoundError);
  });

  it('deletes a debt', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
    });

    await deleteDebt(db, debt.id);

    expect(await getDebtById(db, debt.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown debt', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteDebt(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
