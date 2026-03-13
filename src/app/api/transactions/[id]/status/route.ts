import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status (only allow uncleared/cleared toggle)
    if (!['cleared', 'uncleared'].includes(status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Invalid status. Only cleared or uncleared allowed.' } },
        { status: 400 }
      );
    }

    // Get old transaction
    const [oldTransaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)));

    if (!oldTransaction) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Update transaction status
    const [transaction] = await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .returning();

    // Update account balances if status changed
    if (oldTransaction.status !== status) {
      const amount = oldTransaction.amount;
      let clearedDelta = 0;
      let unclearedDelta = 0;

      // Remove from old bucket
      if (oldTransaction.status === 'uncleared') {
        unclearedDelta -= amount;
        clearedDelta += amount;
      } else {
        clearedDelta -= amount;
        unclearedDelta += amount;
      }

      await db
        .update(accounts)
        .set({
          clearedBalance: sql`${accounts.clearedBalance} + ${clearedDelta}`,
          unclearedBalance: sql`${accounts.unclearedBalance} + ${unclearedDelta}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, oldTransaction.accountId));
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Failed to update transaction status:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update transaction status' } },
      { status: 500 }
    );
  }
}
