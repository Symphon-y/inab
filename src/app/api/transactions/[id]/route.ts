import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { updateBudgetActivityForTransaction } from '@/lib/budget';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)));

    if (!transaction) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch transaction' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the old transaction to calculate balance difference
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

    const [transaction] = await db
      .update(transactions)
      .set({
        categoryId: body.categoryId,
        payee: body.payee,
        amount: body.amount,
        date: body.date ? new Date(body.date) : undefined,
        memo: body.memo,
        status: body.status,
        flag: body.flag,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .returning();

    // Update account balances if amount or status changed
    const oldStatus = oldTransaction.status;
    const newStatus = body.status || oldStatus;
    const oldAmount = oldTransaction.amount;
    const newAmount = body.amount ?? oldAmount;

    if (oldAmount !== newAmount || oldStatus !== newStatus) {
      const balanceDelta = newAmount - oldAmount;
      let clearedDelta = 0;
      let unclearedDelta = 0;

      // Remove from old bucket
      if (oldStatus === 'uncleared') {
        unclearedDelta -= oldAmount;
      } else {
        clearedDelta -= oldAmount;
      }

      // Add to new bucket
      if (newStatus === 'uncleared') {
        unclearedDelta += newAmount;
      } else {
        clearedDelta += newAmount;
      }

      await db
        .update(accounts)
        .set({
          balance: sql`balance + ${balanceDelta}`,
          clearedBalance: sql`clearedBalance + ${clearedDelta}`,
          unclearedBalance: sql`unclearedBalance + ${unclearedDelta}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, oldTransaction.accountId));
    }

    // Update budget allocation activity if category or date changed
    await updateBudgetActivityForTransaction(
      body.categoryId,
      new Date(body.date || oldTransaction.date),
      oldTransaction.categoryId,
      oldTransaction.date
    );

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update transaction' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the transaction to reverse the balance
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)));

    if (!transaction) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(transactions)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));

    // Reverse the balance on the account
    let clearedDelta = 0;
    let unclearedDelta = 0;

    if (transaction.status === 'uncleared') {
      unclearedDelta = -transaction.amount;
    } else {
      clearedDelta = -transaction.amount;
    }

    await db
      .update(accounts)
      .set({
        balance: sql`balance - ${transaction.amount}`,
        clearedBalance: sql`clearedBalance + ${clearedDelta}`,
        unclearedBalance: sql`unclearedBalance + ${unclearedDelta}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, transaction.accountId));

    // Update budget allocation activity if transaction was categorized
    if (transaction.categoryId) {
      await updateBudgetActivityForTransaction(
        transaction.categoryId,
        transaction.date
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete transaction' } },
      { status: 500 }
    );
  }
}
