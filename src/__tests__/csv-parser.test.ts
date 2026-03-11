import { describe, it, expect } from 'vitest';
import { parseCSV } from '@/lib/import/csv-parser';

describe('CSV Parser', () => {
  describe('parseCSV()', () => {
    it('should parse a basic CSV file', async () => {
      const csv = `date,payee,amount,memo
2024-01-15,Starbucks,-5.50,Coffee
2024-01-16,Paycheck,1500.00,Salary`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        payee: 'Starbucks',
        amount: '-5.50',
        memo: 'Coffee',
      });
      expect(result[1]).toEqual({
        date: '2024-01-16',
        payee: 'Paycheck',
        amount: '1500.00',
        memo: 'Salary',
      });
    });

    it('should handle case-insensitive column names', async () => {
      const csv = `Date,Payee,Amount,Memo
2024-01-15,Starbucks,-5.50,Coffee`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].payee).toBe('Starbucks');
      expect(result[0].amount).toBe('-5.50');
      expect(result[0].memo).toBe('Coffee');
    });

    it('should handle description as alternative to payee', async () => {
      const csv = `date,description,amount
2024-01-15,Grocery Store,-50.00`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].payee).toBe('Grocery Store');
    });

    it('should handle notes as alternative to memo', async () => {
      const csv = `date,payee,amount,notes
2024-01-15,Starbucks,-5.50,Morning coffee`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].memo).toBe('Morning coffee');
    });

    it('should handle missing optional columns', async () => {
      const csv = `date,payee,amount
2024-01-15,Starbucks,-5.50`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].memo).toBeUndefined();
    });

    it('should skip empty lines', async () => {
      const csv = `date,payee,amount

2024-01-15,Starbucks,-5.50

2024-01-16,Target,-25.00`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(2);
    });

    it('should trim whitespace', async () => {
      const csv = `date,payee,amount
  2024-01-15  ,  Starbucks  ,  -5.50  `;

      const result = await parseCSV(csv);

      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].payee).toBe('Starbucks');
      expect(result[0].amount).toBe('-5.50');
    });

    it('should handle empty payee', async () => {
      const csv = `date,payee,amount
2024-01-15,,-5.50`;

      const result = await parseCSV(csv);

      expect(result[0].payee).toBe('');
    });

    it('should handle various amount formats', async () => {
      const csv = `date,payee,amount
2024-01-15,Test1,-5.50
2024-01-16,Test2,1500
2024-01-17,Test3,-1234.56`;

      const result = await parseCSV(csv);

      expect(result[0].amount).toBe('-5.50');
      expect(result[1].amount).toBe('1500');
      expect(result[2].amount).toBe('-1234.56');
    });

    it('should throw error for empty CSV', async () => {
      const csv = '';

      await expect(parseCSV(csv)).rejects.toThrow('CSV file is empty');
    });

    it('should throw error for missing date column', async () => {
      const csv = `payee,amount
Starbucks,-5.50`;

      await expect(parseCSV(csv)).rejects.toThrow('CSV must have "date" and "amount" columns');
    });

    it('should throw error for missing amount column', async () => {
      const csv = `date,payee
2024-01-15,Starbucks`;

      await expect(parseCSV(csv)).rejects.toThrow('CSV must have "date" and "amount" columns');
    });

    it('should handle CSV with only headers', async () => {
      const csv = `date,payee,amount`;

      await expect(parseCSV(csv)).rejects.toThrow('CSV file is empty');
    });

    it('should handle quoted fields with commas', async () => {
      const csv = `date,payee,amount,memo
2024-01-15,"Restaurant, Inc",-45.00,"Lunch with team, great food"`;

      const result = await parseCSV(csv);

      expect(result[0].payee).toBe('Restaurant, Inc');
      expect(result[0].memo).toBe('Lunch with team, great food');
    });

    it('should handle mixed case columns', async () => {
      const csv = `DATE,Description,AMOUNT
2024-01-15,Store,-5.50`;

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].payee).toBe('Store');
      expect(result[0].amount).toBe('-5.50');
    });

    it('should handle large CSV files', async () => {
      const rows = [`date,payee,amount`];
      for (let i = 0; i < 1000; i++) {
        rows.push(`2024-01-${String(i % 28 + 1).padStart(2, '0')},Store ${i},-${i}.00`);
      }
      const csv = rows.join('\n');

      const result = await parseCSV(csv);

      expect(result).toHaveLength(1000);
      expect(result[0].payee).toBe('Store 0');
      expect(result[999].payee).toBe('Store 999');
    });
  });
});
