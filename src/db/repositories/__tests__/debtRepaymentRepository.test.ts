import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createDebt } from '../debtRepository';
import { createDebtRepayment, listDebtRepayments } from '../debtRepaymentRepository';

describe('debtRepaymentRepository', () => {
  it('creates a repayment and reads it back', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    const repayment = await createDebtRepayment(db, {
      debtId: debt.id,
      amountMinor: 10000,
      date: '2026-04-01',
    });

    expect(repayment.id).toEqual(expect.any(String));
    expect(repayment.debtId).toBe(debt.id);
    expect(repayment.amountMinor).toBe(10000);
    expect(await listDebtRepayments(db)).toEqual([repayment]);
  });

  it('rejects a repayment linked to an unknown debt (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createDebtRepayment(db, { debtId: 'missing', amountMinor: 10000, date: '2026-04-01' }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('rejects a non-positive amount (CHECK)', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });

    await expect(
      createDebtRepayment(db, { debtId: debt.id, amountMinor: -100, date: '2026-04-01' }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('lists repayments ordered by date descending', async () => {
    const { db } = createFakeDatabase();
    const debt = await createDebt(db, {
      label: 'Prêt',
      counterparty: 'Salma',
      direction: 'owed_to_household',
      amountMinor: 30000,
      currencyCode: 'MAD',
      date: '2026-03-01',
    });
    const earlier = await createDebtRepayment(db, {
      debtId: debt.id,
      amountMinor: 10000,
      date: '2026-04-01',
    });
    const later = await createDebtRepayment(db, {
      debtId: debt.id,
      amountMinor: 5000,
      date: '2026-05-01',
    });

    expect((await listDebtRepayments(db)).map((r) => r.id)).toEqual([later.id, earlier.id]);
  });
});
