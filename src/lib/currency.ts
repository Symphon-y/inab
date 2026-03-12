/**
 * Currency utilities for handling money amounts throughout the application
 *
 * Convention: All amounts are stored in cents (integers) in the database,
 * and converted to/from dollars for display and user input.
 *
 * SimpleFin Integration Note: SimpleFin API returns amounts in dollars (as decimals),
 * not cents. Always use parseSimpleFinAmount() when processing SimpleFin data.
 */

export interface FormatCurrencyOptions {
  /**
   * Minimum number of fraction digits to display (default: 2)
   */
  minimumFractionDigits?: number;

  /**
   * Maximum number of fraction digits to display (default: 2)
   */
  maximumFractionDigits?: number;

  /**
   * Currency code (default: 'USD')
   */
  currency?: string;

  /**
   * Whether to explicitly show + sign for positive values (default: false)
   */
  showSign?: boolean;
}

/**
 * Format amount in cents to currency string
 *
 * @param cents - Amount in cents (can be negative)
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$1,336.89", "-$13.37")
 *
 * @example
 * formatCurrency(133689) // "$1,336.89"
 * formatCurrency(-1337) // "-$13.37"
 * formatCurrency(150000, { maximumFractionDigits: 0 }) // "$1,500"
 * formatCurrency(5000, { showSign: true }) // "+$50.00"
 */
export function formatCurrency(cents: number, options: FormatCurrencyOptions = {}): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currency = 'USD',
    showSign = false,
  } = options;

  const dollars = Math.abs(cents) / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(dollars);

  // Handle negative values (sign outside currency symbol)
  if (cents < 0) {
    return `-${formatted}`;
  }

  // Handle explicit positive sign if requested
  if (showSign && cents > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Convert dollars to cents for storage
 *
 * Handles both string and number inputs, properly rounds to avoid
 * floating-point precision issues.
 *
 * @param dollars - Dollar amount as string or number (e.g., "1336.89" or 1336.89)
 * @returns Amount in cents as integer (e.g., 133689)
 *
 * @example
 * dollarsToCents("1336.89") // 133689
 * dollarsToCents(1336.89) // 133689
 * dollarsToCents("0.50") // 50
 * dollarsToCents("1336") // 133600
 *
 * @throws {Error} If input cannot be parsed as a number
 */
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;

  if (isNaN(amount)) {
    throw new Error(`Invalid dollar amount: ${dollars}`);
  }

  // Multiply by 100 and round to handle floating-point precision
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars for display in input fields
 *
 * Returns a string with exactly 2 decimal places, suitable for
 * pre-filling form inputs.
 *
 * @param cents - Amount in cents
 * @returns Dollar amount as string with 2 decimal places (e.g., "1336.89")
 *
 * @example
 * centsToDollars(133689) // "1336.89"
 * centsToDollars(50) // "0.50"
 * centsToDollars(0) // "0.00"
 * centsToDollars(-1337) // "-13.37"
 */
export function centsToDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars.toFixed(2);
}

/**
 * Parse SimpleFin amount (in dollars) to cents
 *
 * IMPORTANT: SimpleFin API returns amounts in dollars (as decimals), NOT cents (as integers).
 * This is contrary to how amounts are stored internally (as cents).
 *
 * Use this function whenever processing amounts from SimpleFin API responses:
 * - Account balances
 * - Transaction amounts
 *
 * @param amount - SimpleFin amount in dollars (e.g., 1336.89 or "1336.89")
 * @returns Amount in cents as integer (e.g., 133689)
 *
 * @example
 * // SimpleFin returns a transaction amount in dollars:
 * const simpleFinTransaction = { amount: 1336.89 }
 * const cents = parseSimpleFinAmount(simpleFinTransaction.amount) // 133689
 *
 * // SimpleFin returns an account balance in dollars:
 * const simpleFinAccount = { balance: 5000.50 }
 * const cents = parseSimpleFinAmount(simpleFinAccount.balance) // 500050
 *
 * @throws {Error} If amount cannot be parsed as a number
 */
export function parseSimpleFinAmount(amount: number | string): number {
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(parsed)) {
    throw new Error(`Invalid SimpleFin amount: ${amount}`);
  }

  // SimpleFin sends dollars, so multiply by 100 to convert to cents
  return Math.round(parsed * 100);
}
