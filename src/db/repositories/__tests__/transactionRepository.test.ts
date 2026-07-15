import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createCategory } from '../categoryRepository';
import { NotFoundError } from '../errors';
import { createMember } from '../memberRepository';
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from '../transactionRepository';

async function seedCategoryAndMember(db: ReturnType<typeof createFakeDatabase>['db']) {
  const category = await createCategory(db, {
    name: 'Alimentation',
    icon: 'cart',
    color: '#00FF00',
  });
  const member = await createMember(db, { name: 'Salma' });
  return { category, member };
}

describe('transactionRepository', () => {
  it('creates an expense transaction and reads it back', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 12000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
      note: 'Courses hebdomadaires',
    });

    expect(transaction.id).toEqual(expect.any(String));
    expect(transaction.type).toBe('expense');
    expect(transaction.amountMinor).toBe(12000);
    expect(transaction.currencyCode).toBe('MAD');
    expect(await getTransactionById(db, transaction.id)).toEqual(transaction);
  });

  it('creates an income transaction (US-011)', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    const transaction = await createTransaction(db, {
      type: 'income',
      amountMinor: 500000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
      note: 'Salaire',
    });

    expect(transaction.type).toBe('income');
    expect(await getTransactionById(db, transaction.id)).toEqual(transaction);
  });

  it('defaults note to null when omitted', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });

    expect(transaction.note).toBeNull();
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getTransactionById(db, 'missing')).toBeNull();
  });

  it('rejects a negative amount (CHECK amount_minor >= 0)', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    await expect(
      createTransaction(db, {
        type: 'expense',
        amountMinor: -100,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-07-05T10:00:00.000Z',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('rejects an unknown category id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const { member } = await seedCategoryAndMember(db);

    await expect(
      createTransaction(db, {
        type: 'expense',
        amountMinor: 1000,
        currencyCode: 'MAD',
        categoryId: 'missing-category',
        memberId: member.id,
        occurredAt: '2026-07-05T10:00:00.000Z',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('rejects an unknown member id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const { category } = await seedCategoryAndMember(db);

    await expect(
      createTransaction(db, {
        type: 'expense',
        amountMinor: 1000,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: 'missing-member',
        occurredAt: '2026-07-05T10:00:00.000Z',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('lists transactions ordered by occurredAt descending', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    await createTransaction(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-01T10:00:00.000Z',
    });
    await createTransaction(db, {
      type: 'expense',
      amountMinor: 2000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-03T10:00:00.000Z',
    });

    const transactions = await listTransactions(db);
    expect(transactions.map((t) => t.occurredAt)).toEqual([
      '2026-07-03T10:00:00.000Z',
      '2026-07-01T10:00:00.000Z',
    ]);
  });

  it('updates a transaction and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });

    const updated = await updateTransaction(db, transaction.id, {
      amountMinor: 1500,
      note: 'Ajusté',
    });

    expect(updated.amountMinor).toBe(1500);
    expect(updated.note).toBe('Ajusté');
    expect(await getTransactionById(db, transaction.id)).toEqual(updated);
  });

  it('can change a transaction from expense to income via patch', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });

    const updated = await updateTransaction(db, transaction.id, { type: 'income' });

    expect(updated.type).toBe('income');
  });

  it('throws NotFoundError when updating an unknown transaction', async () => {
    const { db } = createFakeDatabase();
    await expect(updateTransaction(db, 'missing', { amountMinor: 100 })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deletes a transaction', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const transaction = await createTransaction(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: '2026-07-05T10:00:00.000Z',
    });

    await deleteTransaction(db, transaction.id);

    expect(await getTransactionById(db, transaction.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown transaction', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteTransaction(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
