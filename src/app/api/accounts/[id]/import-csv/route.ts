import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { parseCSV } from '@/lib/import/csv-parser';
import { updateBudgetActivityForTransaction } from '@/lib/budget';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: { code: 'NO_FILE', message: 'No file provided' } }, { status: 400 });
    }

    // Validate account exists
    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, accountId), isNull(accounts.deletedAt)));

    if (!account) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    const fileContent = await file.text();
    const csvTransactions = await parseCSV(fileContent);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const txn of csvTransactions) {
      try {
        // Parse date
        const date = new Date(txn.date);
        if (isNaN(date.getTime())) {
          errors.push(`Invalid date: ${txn.date}`);
          continue;
        }

        // Parse amount (convert to cents)
        // Handle negative amounts (outflows) and positive (inflows)
        const amountFloat = parseFloat(txn.amount.replace(/[,$]/g, ''));
        if (isNaN(amountFloat)) {
          errors.push(`Invalid amount: ${txn.amount}`);
          continue;
        }
        const amount = Math.round(amountFloat * 100);

        // Generate import ID based on date + amount + payee (for deduplication)
        const importId = `csv:${accountId}:${date.toISOString()}:${amount}:${txn.payee}`;

        // Check for duplicate
        const [existing] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.importId, importId), isNull(transactions.deletedAt)));

        if (existing) {
          skipped++;
          continue;
        }

        // Insert transaction
        const [newTransaction] = await db
          .insert(transactions)
          .values({
            accountId,
            importId,
            date,
            amount,
            payee: txn.payee,
            memo: txn.memo,
            status: 'cleared', // CSV imports are assumed cleared
          })
          .returning();

        imported++;

        // Update account balance
        await db
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${amount}`,
            clearedBalance: sql`${accounts.clearedBalance} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, accountId));

        // Update budget activity if categorized
        if (newTransaction.categoryId) {
          await updateBudgetActivityForTransaction(newTransaction.categoryId, date);
        }
      } catch (error) {
        errors.push(`Row error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: csvTransactions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('CSV import failed:', error);
    return NextResponse.json(
      { error: { code: 'IMPORT_ERROR', message: error instanceof Error ? error.message : 'Failed to import CSV' } },
      { status: 500 }
    );
  }
}
