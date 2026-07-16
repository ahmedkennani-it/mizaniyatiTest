/**
 * How many decimal places a currency uses — 2 for MAD/EUR, 0 for JPY, 3 for BHD. Read from `Intl`
 * rather than a hardcoded table, so any valid ISO 4217 code works without maintenance (the same
 * source `toMajorUnits` uses for its exponent).
 */
export function currencyDecimals(currencyCode: string): number {
  return (
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/**
 * Whether a keypad entry is allowed to grow into `next` for this currency (US-016).
 *
 * Rejects rather than truncates: silently dropping a digit the user just typed makes the amount
 * they see disagree with the keys they pressed, which is exactly how a wrong amount gets saved.
 */
export function acceptsAmountInput(next: string, currencyCode: string): boolean {
  const decimals = currencyDecimals(currencyCode);

  if (next === '') {
    return true;
  }
  const pattern = decimals === 0 ? /^\d*$/ : new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`);
  return pattern.test(next);
}
