import { acceptsAmountInput, currencyDecimals } from '../currencyDecimals';

/** US-016: "le nombre de décimales suit la devise (MAD/EUR : 2 ; devises sans décimale : 0)". */
describe('currencyDecimals', () => {
  it.each([
    ['MAD', 2],
    ['EUR', 2],
    ['USD', 2],
    ['JPY', 0],
    ['BHD', 3],
  ])('%s uses %s decimals', (currency, decimals) => {
    expect(currencyDecimals(currency)).toBe(decimals);
  });
});

describe('acceptsAmountInput', () => {
  it('accepts an empty entry — a field being cleared', () => {
    expect(acceptsAmountInput('', 'MAD')).toBe(true);
  });

  it.each(['4', '42', '42.', '42.5', '42.50'])('accepts %s for a 2-decimal currency', (input) => {
    expect(acceptsAmountInput(input, 'MAD')).toBe(true);
  });

  /**
   * Rejected rather than truncated: silently dropping a digit the user just pressed makes the
   * amount on screen disagree with the keys they hit, which is how a wrong amount gets saved.
   */
  it('rejects a third decimal on a 2-decimal currency', () => {
    expect(acceptsAmountInput('42.505', 'MAD')).toBe(false);
  });

  it('rejects any decimal on a 0-decimal currency', () => {
    expect(acceptsAmountInput('42.', 'JPY')).toBe(false);
    expect(acceptsAmountInput('42.5', 'JPY')).toBe(false);
  });

  it('accepts whole numbers on a 0-decimal currency', () => {
    expect(acceptsAmountInput('1234', 'JPY')).toBe(true);
  });

  it('accepts three decimals on a 3-decimal currency', () => {
    expect(acceptsAmountInput('42.505', 'BHD')).toBe(true);
    expect(acceptsAmountInput('42.5055', 'BHD')).toBe(false);
  });

  it('rejects a second decimal point', () => {
    expect(acceptsAmountInput('42.5.0', 'MAD')).toBe(false);
  });

  it('rejects anything that is not a number', () => {
    expect(acceptsAmountInput('42a', 'MAD')).toBe(false);
    expect(acceptsAmountInput('-42', 'MAD')).toBe(false);
  });
});
