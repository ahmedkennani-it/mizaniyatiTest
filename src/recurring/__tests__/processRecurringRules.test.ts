jest.mock('../../notifications', () => {
  const actual = jest.requireActual('../../notifications');
  return { ...actual, notificationClient: { presentNow: jest.fn() } };
});

// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import {
  createCategory,
  createMember,
  createRecurringRule,
  getRecurringRuleById,
  listTransactions,
} from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { notificationClient } from '../../notifications';
// eslint-disable-next-line import/first -- must come after jest.mock('../../notifications', ...) above
import { processRecurringRules } from '../processRecurringRules';

async function seedCategoryAndMember(db: ReturnType<typeof createFakeDatabase>['db']) {
  const category = await createCategory(db, { name: 'Logement', icon: 'home', color: '#0D9488' });
  const member = await createMember(db, { name: 'Youssef' });
  return { category, member };
}

describe('processRecurringRules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a transaction for a due auto-mode rule and advances lastRunDate', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const rule = await createRecurringRule(db, {
      type: 'income',
      amountMinor: 1400000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'auto',
      note: 'Salaire',
    });

    await processRecurringRules(db, new Date('2026-07-01T10:00:00.000Z'));

    const transactions = await listTransactions(db);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      amountMinor: 1400000,
      type: 'income',
      note: 'Salaire',
    });

    const updated = await getRecurringRuleById(db, rule.id);
    expect(updated?.lastRunDate).toBe('2026-07-01');
    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
  });

  it('catches up every missed occurrence in one run and sends a single notification', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-04-01',
      mode: 'auto',
    });

    await processRecurringRules(db, new Date('2026-07-15T00:00:00.000Z'));

    const transactions = await listTransactions(db);
    expect(transactions).toHaveLength(4); // April, May, June, July
    expect(notificationClient.presentNow).toHaveBeenCalledTimes(1);
  });

  it('does not touch a prompt-mode rule', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const rule = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'prompt',
    });

    await processRecurringRules(db, new Date('2026-07-01T00:00:00.000Z'));

    expect(await listTransactions(db)).toHaveLength(0);
    const updated = await getRecurringRuleById(db, rule.id);
    expect(updated?.lastRunDate).toBeNull();
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('does not touch a paused auto-mode rule', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'auto',
      paused: true,
    });

    await processRecurringRules(db, new Date('2026-07-01T00:00:00.000Z'));

    expect(await listTransactions(db)).toHaveLength(0);
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });

  it('is a no-op when nothing is due yet', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-08-01',
      mode: 'auto',
    });

    await processRecurringRules(db, new Date('2026-07-15T00:00:00.000Z'));

    expect(await listTransactions(db)).toHaveLength(0);
    expect(notificationClient.presentNow).not.toHaveBeenCalled();
  });
});
