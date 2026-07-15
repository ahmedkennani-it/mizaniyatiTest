import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { createZakatAssessment, listZakatAssessments } from '../zakatAssessmentRepository';
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
});
