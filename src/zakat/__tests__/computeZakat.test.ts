import { computeNisabMinor, computeZakatAssessment } from '../computeZakat';

describe('computeNisabMinor', () => {
  it('computes the gold nisab (85g) from a per-gram price', () => {
    expect(computeNisabMinor('gold', 60000, null)).toBe(5100000); // 60000 * 85
  });

  it('computes the silver nisab (595g) from a per-gram price', () => {
    expect(computeNisabMinor('silver', null, 900)).toBe(535500); // 900 * 595
  });

  it('returns null when the price for the selected basis is missing', () => {
    expect(computeNisabMinor('gold', null, 900)).toBeNull();
    expect(computeNisabMinor('silver', 60000, null)).toBeNull();
  });

  it('recalculates when the basis switches, even with both prices set', () => {
    const gold = computeNisabMinor('gold', 60000, 900);
    const silver = computeNisabMinor('silver', 60000, 900);
    expect(gold).toBe(5100000);
    expect(silver).toBe(535500);
    expect(gold).not.toBe(silver);
  });
});

describe('computeZakatAssessment', () => {
  it('computes base = assets - debts and due = 2.5% when above nisab', () => {
    const result = computeZakatAssessment(
      { cashMinor: 1000000, goldSilverMinor: 0, investmentsMinor: 0, debtsMinor: 200000 },
      500000,
    );

    expect(result.baseMinor).toBe(800000);
    expect(result.aboveNisab).toBe(true);
    expect(result.dueMinor).toBe(20000); // 800000 * 0.025
  });

  it('sums cash + goldSilver + investments before subtracting debts', () => {
    const result = computeZakatAssessment(
      { cashMinor: 100000, goldSilverMinor: 200000, investmentsMinor: 50000, debtsMinor: 0 },
      100000,
    );

    expect(result.baseMinor).toBe(350000);
  });

  it('floors the base at 0 when debts exceed assets (cas limite)', () => {
    const result = computeZakatAssessment(
      { cashMinor: 100000, goldSilverMinor: 0, investmentsMinor: 0, debtsMinor: 500000 },
      100000,
    );

    expect(result.baseMinor).toBe(0);
    expect(result.dueMinor).toBe(0);
    expect(result.aboveNisab).toBe(false);
  });

  it('owes nothing when below nisab, without asserting anything is wrong', () => {
    const result = computeZakatAssessment(
      { cashMinor: 300000, goldSilverMinor: 0, investmentsMinor: 0, debtsMinor: 0 },
      500000,
    );

    expect(result.aboveNisab).toBe(false);
    expect(result.dueMinor).toBe(0);
    expect(result.baseMinor).toBe(300000);
  });

  it('cannot assert aboveNisab when the nisab price is unavailable', () => {
    const result = computeZakatAssessment(
      { cashMinor: 999999999, goldSilverMinor: 0, investmentsMinor: 0, debtsMinor: 0 },
      null,
    );

    expect(result.nisabMinor).toBeNull();
    expect(result.aboveNisab).toBe(false);
    expect(result.dueMinor).toBe(0);
  });

  it('is exactly at the nisab threshold, which counts as above (>=)', () => {
    const result = computeZakatAssessment(
      { cashMinor: 500000, goldSilverMinor: 0, investmentsMinor: 0, debtsMinor: 0 },
      500000,
    );

    expect(result.aboveNisab).toBe(true);
  });
});
