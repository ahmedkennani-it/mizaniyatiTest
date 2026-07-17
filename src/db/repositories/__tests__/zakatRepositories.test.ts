import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createCategory } from '../categoryRepository';
import { NotFoundError } from '../errors';
import { createMember } from '../memberRepository';
import { createTransaction } from '../transactionRepository';
import {
  createZakatAssessment,
  getZakatAssessmentById,
  listZakatAssessments,
  markZakatAssessmentPaid,
  markZakatAssessmentReminded,
} from '../zakatAssessmentRepository';
import { getZakatConfig, updateZakatConfig } from '../zakatConfigRepository';

describe('zakatConfigRepository', () => {
  it('defaults to gold basis with no prices set when nothing has been saved', async () => {
    const { db } = createFakeDatabase();

    const config = await getZakatConfig(db);

    expect(config).toEqual({
      madhhab: '',
      nisabBasis: 'gold',
      goldPricePerGramMinor: null,
      silverPricePerGramMinor: null,
      priceUpdatedAt: null,
    });
  });

  it('creates the row on first update and reads it back', async () => {
    const { db } = createFakeDatabase();

    const updated = await updateZakatConfig(db, { madhhab: 'Hanafi', nisabBasis: 'silver' });

    expect(updated.madhhab).toBe('Hanafi');
    expect(updated.nisabBasis).toBe('silver');
    expect(await getZakatConfig(db)).toEqual(updated);
  });

  it('bumps priceUpdatedAt when a price is set, not on unrelated config edits', async () => {
    const { db } = createFakeDatabase();

    const withPrice = await updateZakatConfig(db, { goldPricePerGramMinor: 65000 });
    expect(withPrice.priceUpdatedAt).not.toBeNull();

    const afterMadhhabEdit = await updateZakatConfig(db, { madhhab: 'Shafi' });
    expect(afterMadhhabEdit.priceUpdatedAt).toBe(withPrice.priceUpdatedAt);
  });

  it('keeps the silver price when switching basis back to gold', async () => {
    const { db } = createFakeDatabase();

    await updateZakatConfig(db, { silverPricePerGramMinor: 900 });
    const updated = await updateZakatConfig(db, { nisabBasis: 'gold' });

    expect(updated.silverPricePerGramMinor).toBe(900);
    expect(updated.nisabBasis).toBe('gold');
  });
});

describe('zakatAssessmentRepository', () => {
  it('creates an assessment and reads it back', async () => {
    const { db } = createFakeDatabase();

    const assessment = await createZakatAssessment(db, {
      cashMinor: 1000000,
      goldSilverMinor: 0,
      investmentsMinor: 0,
      debtsMinor: 200000,
      baseMinor: 800000,
      dueMinor: 20000,
      aboveNisab: true,
    });

    expect(assessment.id).toEqual(expect.any(String));
    expect(assessment.aboveNisab).toBe(true);
    expect(await listZakatAssessments(db)).toEqual([assessment]);
  });

  it('lists assessments ordered by creation descending', async () => {
    // Fake timers force distinct `created_at` timestamps — two real-clock calls this close
    // together can land in the same millisecond, making "ORDER BY created_at DESC" ambiguous.
    jest.useFakeTimers({ now: new Date('2026-07-01T10:00:00.000Z') });
    const { db } = createFakeDatabase();
    const first = await createZakatAssessment(db, {
      cashMinor: 100,
      goldSilverMinor: 0,
      investmentsMinor: 0,
      debtsMinor: 0,
      baseMinor: 100,
      dueMinor: 2,
      aboveNisab: false,
    });
    jest.setSystemTime(new Date('2026-07-01T10:00:01.000Z'));
    const second = await createZakatAssessment(db, {
      cashMinor: 200,
      goldSilverMinor: 0,
      investmentsMinor: 0,
      debtsMinor: 0,
      baseMinor: 200,
      dueMinor: 5,
      aboveNisab: false,
    });

    expect((await listZakatAssessments(db)).map((a) => a.id)).toEqual([second.id, first.id]);
    jest.useRealTimers();
  });

  it('rejects a negative amount (CHECK)', async () => {
    const { db } = createFakeDatabase();

    await expect(
      createZakatAssessment(db, {
        cashMinor: -100,
        goldSilverMinor: 0,
        investmentsMinor: 0,
        debtsMinor: 0,
        baseMinor: 0,
        dueMinor: 0,
        aboveNisab: false,
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  /** US-043: "enregistrer & planifier le don" — a chosen due date, and the paid/reminded state
   * that starts unset until the household acts on the plan. */
  describe('planning (US-043)', () => {
    async function seed(dueDate: string | null = '2026-08-01') {
      const { db } = createFakeDatabase();
      const assessment = await createZakatAssessment(db, {
        cashMinor: 1000000,
        goldSilverMinor: 0,
        investmentsMinor: 0,
        debtsMinor: 0,
        baseMinor: 1000000,
        dueMinor: 25000,
        aboveNisab: true,
        dueDate,
      });
      return { db, assessment };
    }

    it('starts with no due date when none is given', async () => {
      const { db } = createFakeDatabase();
      const assessment = await createZakatAssessment(db, {
        cashMinor: 100,
        goldSilverMinor: 0,
        investmentsMinor: 0,
        debtsMinor: 0,
        baseMinor: 100,
        dueMinor: 2,
        aboveNisab: false,
      });
      expect(assessment.dueDate).toBeNull();
      expect(assessment.paidAt).toBeNull();
      expect(assessment.transactionId).toBeNull();
      expect(assessment.remindedAt).toBeNull();
    });

    it('stores the chosen due date', async () => {
      const { assessment } = await seed('2026-08-01');
      expect(assessment.dueDate).toBe('2026-08-01');
    });

    it('marks a plan paid, linking its transaction', async () => {
      const { db, assessment } = await seed();
      const category = await createCategory(db, {
        name: 'Zakat & dons',
        icon: 'hand-heart',
        color: '#B45309',
      });
      const member = await createMember(db, { name: 'Youssef' });
      const transaction = await createTransaction(db, {
        type: 'expense',
        amountMinor: assessment.dueMinor,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: '2026-08-01T09:00:00.000Z',
      });

      const paid = await markZakatAssessmentPaid(db, assessment.id, {
        paidAt: '2026-08-01T09:00:00.000Z',
        transactionId: transaction.id,
      });

      expect(paid.paidAt).toBe('2026-08-01T09:00:00.000Z');
      expect(paid.transactionId).toBe(transaction.id);
      expect(await getZakatAssessmentById(db, assessment.id)).toEqual(paid);
    });

    it('refuses to mark an unknown assessment paid', async () => {
      const { db } = createFakeDatabase();
      await expect(
        markZakatAssessmentPaid(db, 'missing', { paidAt: '2026-08-01', transactionId: 'tx-1' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('marks a plan reminded, independent of paid status', async () => {
      const { db, assessment } = await seed();

      const reminded = await markZakatAssessmentReminded(db, assessment.id, '2026-08-01T09:00:00.000Z');

      expect(reminded.remindedAt).toBe('2026-08-01T09:00:00.000Z');
      expect(reminded.paidAt).toBeNull();
    });
  });
});
