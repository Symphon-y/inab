import { describe, it, expect } from 'vitest';
import { formatCurrency, dollarsToCents, centsToDollars, parseSimpleFinAmount } from './currency';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(133689)).toBe('$1,336.89');
    expect(formatCurrency(50)).toBe('$0.50');
    expect(formatCurrency(100)).toBe('$1.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-1337)).toBe('-$13.37');
    expect(formatCurrency(-50)).toBe('-$0.50');
    expect(formatCurrency(-100000000)).toBe('-$1,000,000.00');
  });

  it('formats large amounts correctly', () => {
    expect(formatCurrency(100000000)).toBe('$1,000,000.00');
    expect(formatCurrency(123456789)).toBe('$1,234,567.89');
  });

  it('respects maximumFractionDigits option', () => {
    // Note: For currency formatting, minimumFractionDigits defaults to match maximumFractionDigits
    expect(formatCurrency(150000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$1,500');
    expect(formatCurrency(150050, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$1,501');
    expect(formatCurrency(150025, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$1,500');
  });

  it('respects minimumFractionDigits option', () => {
    expect(formatCurrency(100, { minimumFractionDigits: 0 })).toBe('$1');
    expect(formatCurrency(150, { minimumFractionDigits: 0 })).toBe('$1.5');
    expect(formatCurrency(100, { minimumFractionDigits: 2 })).toBe('$1.00');
  });

  it('shows explicit positive sign when requested', () => {
    expect(formatCurrency(5000, { showSign: true })).toBe('+$50.00');
    expect(formatCurrency(100, { showSign: true })).toBe('+$1.00');
    expect(formatCurrency(0, { showSign: true })).toBe('$0.00'); // Zero shouldn't show +
    expect(formatCurrency(-5000, { showSign: true })).toBe('-$50.00'); // Negative still shows -
  });

  it('handles edge cases', () => {
    expect(formatCurrency(1)).toBe('$0.01');
    expect(formatCurrency(-1)).toBe('-$0.01');
  });
});

describe('dollarsToCents', () => {
  it('converts string dollar amounts to cents', () => {
    expect(dollarsToCents('1336.89')).toBe(133689);
    expect(dollarsToCents('0.50')).toBe(50);
    expect(dollarsToCents('1336')).toBe(133600);
    expect(dollarsToCents('0.01')).toBe(1);
  });

  it('converts number dollar amounts to cents', () => {
    expect(dollarsToCents(1336.89)).toBe(133689);
    expect(dollarsToCents(0.50)).toBe(50);
    expect(dollarsToCents(1336)).toBe(133600);
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it('handles negative amounts', () => {
    expect(dollarsToCents('-13.37')).toBe(-1337);
    expect(dollarsToCents(-13.37)).toBe(-1337);
  });

  it('handles zero', () => {
    expect(dollarsToCents('0')).toBe(0);
    expect(dollarsToCents(0)).toBe(0);
    expect(dollarsToCents('0.00')).toBe(0);
  });

  it('handles large amounts', () => {
    expect(dollarsToCents('1000000.00')).toBe(100000000);
    expect(dollarsToCents(1000000)).toBe(100000000);
  });

  it('rounds correctly for floating-point precision issues', () => {
    // JavaScript has floating-point precision issues
    // 0.1 + 0.2 = 0.30000000000000004
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
    // Note: 1.005 * 100 = 100.49999999999999 in JavaScript, which rounds to 100
    // This is expected behavior due to IEEE 754 floating-point representation
    expect(dollarsToCents(1.005)).toBe(100);
  });

  it('throws error for invalid inputs', () => {
    expect(() => dollarsToCents('invalid')).toThrow('Invalid dollar amount');
    expect(() => dollarsToCents('abc')).toThrow('Invalid dollar amount');
    expect(() => dollarsToCents('')).toThrow('Invalid dollar amount');
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollar strings', () => {
    expect(centsToDollars(133689)).toBe('1336.89');
    expect(centsToDollars(50)).toBe('0.50');
    expect(centsToDollars(100)).toBe('1.00');
    expect(centsToDollars(0)).toBe('0.00');
  });

  it('handles negative amounts', () => {
    expect(centsToDollars(-1337)).toBe('-13.37');
    expect(centsToDollars(-50)).toBe('-0.50');
  });

  it('handles large amounts', () => {
    expect(centsToDollars(100000000)).toBe('1000000.00');
  });

  it('always returns exactly 2 decimal places', () => {
    expect(centsToDollars(1)).toBe('0.01');
    expect(centsToDollars(10)).toBe('0.10');
    expect(centsToDollars(100)).toBe('1.00');
    expect(centsToDollars(1000)).toBe('10.00');
  });
});

describe('parseSimpleFinAmount', () => {
  it('converts SimpleFin dollar amounts to cents', () => {
    expect(parseSimpleFinAmount(1336.89)).toBe(133689);
    expect(parseSimpleFinAmount(0.50)).toBe(50);
    expect(parseSimpleFinAmount(1336)).toBe(133600);
    expect(parseSimpleFinAmount(0.01)).toBe(1);
  });

  it('handles string inputs from SimpleFin', () => {
    expect(parseSimpleFinAmount('1336.89')).toBe(133689);
    expect(parseSimpleFinAmount('0.50')).toBe(50);
  });

  it('handles negative amounts (outflows)', () => {
    expect(parseSimpleFinAmount(-1336.89)).toBe(-133689);
    expect(parseSimpleFinAmount('-13.37')).toBe(-1337);
  });

  it('handles zero', () => {
    expect(parseSimpleFinAmount(0)).toBe(0);
    expect(parseSimpleFinAmount('0')).toBe(0);
    expect(parseSimpleFinAmount('0.00')).toBe(0);
  });

  it('handles large balances', () => {
    expect(parseSimpleFinAmount(1000000.00)).toBe(100000000);
    expect(parseSimpleFinAmount(5000.50)).toBe(500050);
  });

  it('rounds correctly for floating-point precision', () => {
    // 1.005 * 100 = 100.49999999999999 in JavaScript, rounds to 100
    expect(parseSimpleFinAmount(1.005)).toBe(100);
    expect(parseSimpleFinAmount(0.1 + 0.2)).toBe(30);
  });

  it('throws error for invalid inputs', () => {
    expect(() => parseSimpleFinAmount('invalid')).toThrow('Invalid SimpleFin amount');
    expect(() => parseSimpleFinAmount('')).toThrow('Invalid SimpleFin amount');
  });

  it('handles the specific bug case from issue', () => {
    // The bug: SimpleFin sends 1336.89 (dollars), we were storing as 1337 (thinking it was cents)
    // Then displaying as 1337 / 100 = $13.37
    // This test ensures we now correctly convert to 133689 cents
    const simpleFinAmount = 1336.89;
    const cents = parseSimpleFinAmount(simpleFinAmount);
    expect(cents).toBe(133689);

    // Verify it displays correctly
    expect(formatCurrency(cents)).toBe('$1,336.89');
  });
});

describe('roundtrip conversions', () => {
  it('dollarsToCents -> centsToDollars roundtrip', () => {
    const original = '1336.89';
    const cents = dollarsToCents(original);
    const back = centsToDollars(cents);
    expect(back).toBe(original);
  });

  it('parseSimpleFinAmount -> formatCurrency roundtrip', () => {
    const simpleFinAmount = 1336.89;
    const cents = parseSimpleFinAmount(simpleFinAmount);
    const formatted = formatCurrency(cents);
    expect(formatted).toBe('$1,336.89');
  });

  it('handles various amounts correctly', () => {
    const testCases = [
      { dollars: '0.01', cents: 1, formatted: '$0.01' },
      { dollars: '0.50', cents: 50, formatted: '$0.50' },
      { dollars: '1.00', cents: 100, formatted: '$1.00' },
      { dollars: '1336.89', cents: 133689, formatted: '$1,336.89' },
      { dollars: '1000000.00', cents: 100000000, formatted: '$1,000,000.00' },
    ];

    testCases.forEach(({ dollars, cents, formatted }) => {
      expect(dollarsToCents(dollars)).toBe(cents);
      expect(centsToDollars(cents)).toBe(dollars);
      expect(formatCurrency(cents)).toBe(formatted);
    });
  });
});
