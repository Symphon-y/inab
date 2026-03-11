import { parse } from 'csv-parse/sync';

/**
 * CSV transaction record
 */
export interface CSVTransaction {
  date: string;
  payee: string;
  amount: string;
  memo?: string;
}

/**
 * Parse CSV file content into transaction records
 *
 * Supports flexible column naming (case-insensitive):
 * - Date: "date", "Date", "DATE"
 * - Payee: "payee", "Payee", "description", "Description"
 * - Amount: "amount", "Amount"
 * - Memo: "memo", "Memo", "notes", "Notes"
 *
 * @param fileContent - Raw CSV file content as string
 * @returns Array of parsed CSV transactions
 * @throws {Error} If CSV is invalid or missing required columns
 *
 * @example
 * const transactions = await parseCSV(csvContent);
 * transactions.forEach(txn => {
 *   console.log(`${txn.date}: ${txn.payee} - $${txn.amount}`);
 * });
 */
export async function parseCSV(fileContent: string): Promise<CSVTransaction[]> {
  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Allow flexible column naming
      cast: false,
    });

    // Validate we got some data
    if (records.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Get the first record to check column names
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord);

    // Find date column (case-insensitive)
    const dateColumn = columns.find((col) => col.toLowerCase() === 'date');

    // Find amount column (case-insensitive)
    const amountColumn = columns.find((col) => col.toLowerCase() === 'amount');

    // Validate required columns exist
    if (!dateColumn || !amountColumn) {
      throw new Error(
        'CSV must have "date" and "amount" columns. ' + `Found columns: ${columns.join(', ')}`
      );
    }

    // Find optional columns (case-insensitive)
    const payeeColumn =
      columns.find((col) => col.toLowerCase() === 'payee') ||
      columns.find((col) => col.toLowerCase() === 'description');

    const memoColumn =
      columns.find((col) => col.toLowerCase() === 'memo') ||
      columns.find((col) => col.toLowerCase() === 'notes');

    // Map records to standard format
    return records.map((record: any) => ({
      date: record[dateColumn],
      payee: payeeColumn ? record[payeeColumn] || '' : '',
      amount: record[amountColumn],
      memo: memoColumn ? record[memoColumn] : undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
    throw new Error('Failed to parse CSV: Unknown error');
  }
}
