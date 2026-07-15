import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createCategory } from '../categoryRepository';
import { NotFoundError } from '../errors';
import { createMember } from '../memberRepository';
import {
  createRecurringRule,
  deleteRecurringRule,
  getRecurringRuleById,
  listRecurringRules,
  updateRecurringRule,
} from '../recurringRuleRepository';

async function seedCategoryAndMember(db: ReturnType<typeof createFakeDatabase>['db']) {
  const category = await createCategory(db, { name: 'Logement', icon: 'home', color: '#0D9488' });
  const member = await createMember(db, { name: 'Youssef' });
  return { category, member };
}

describe('recurringRuleRepository', () => {
  it('creates a monthly rule and reads it back', async () => {
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
      mode: 'prompt',
      note: 'Salaire',
    });

    expect(rule.id).toEqual(expect.any(String));
    expect(rule.frequency).toBe('monthly');
    expect(rule.dayOfMonth).toBe(1);
    expect(rule.weekday).toBeNull();
    expect(rule.paused).toBe(false);
    expect(rule.lastRunDate).toBeNull();
    expect(await getRecurringRuleById(db, rule.id)).toEqual(rule);
  });

  it('creates a weekly rule', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    const rule = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'weekly',
      weekday: 5,
      startDate: '2026-07-03',
      mode: 'auto',
    });

    expect(rule.frequency).toBe('weekly');
    expect(rule.weekday).toBe(5);
    expect(rule.dayOfMonth).toBeNull();
  });

  it('rejects an unknown category id (FOREIGN KEY)', async () => {
    const { db } = createFakeDatabase();
    const { member } = await seedCategoryAndMember(db);

    await expect(
      createRecurringRule(db, {
        type: 'expense',
        amountMinor: 1000,
        currencyCode: 'MAD',
        categoryId: 'missing-category',
        memberId: member.id,
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: '2026-07-01',
        mode: 'prompt',
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it('rejects a negative amount (CHECK amount_minor >= 0)', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);

    await expect(
      createRecurringRule(db, {
        type: 'expense',
        amountMinor: -100,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: '2026-07-01',
        mode: 'prompt',
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getRecurringRuleById(db, 'missing')).toBeNull();
  });

  it('lists rules ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const first = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'prompt',
    });
    const second = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 2000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'weekly',
      weekday: 1,
      startDate: '2026-07-01',
      mode: 'auto',
    });

    const rules = await listRecurringRules(db);
    expect(rules.map((rule) => rule.id)).toEqual([first.id, second.id]);
  });

  it('updates a rule (e.g. amount, pause) and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const rule = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'prompt',
    });

    const updated = await updateRecurringRule(db, rule.id, { amountMinor: 1500, paused: true });

    expect(updated.amountMinor).toBe(1500);
    expect(updated.paused).toBe(true);
    expect(await getRecurringRuleById(db, rule.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown rule', async () => {
    const { db } = createFakeDatabase();
    await expect(updateRecurringRule(db, 'missing', { amountMinor: 100 })).rejects.toThrow(NotFoundError);
  });

  it('deletes a rule', async () => {
    const { db } = createFakeDatabase();
    const { category, member } = await seedCategoryAndMember(db);
    const rule = await createRecurringRule(db, {
      type: 'expense',
      amountMinor: 1000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      mode: 'prompt',
    });

    await deleteRecurringRule(db, rule.id);

    expect(await getRecurringRuleById(db, rule.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown rule', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteRecurringRule(db, 'missing')).rejects.toThrow(NotFoundError);
  });
});
