import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, transactions, accountConnections } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { updateBudgetActivityForTransaction } from '@/lib/budget';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch account' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [account] = await db
      .update(accounts)
      .set({
        name: body.name,
        accountType: body.accountType,
        isOnBudget: body.isOnBudget,
        isClosed: body.isClosed,
        note: body.note,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning();

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update account' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const now = new Date();

    // Soft delete account
    const [account] = await db
      .update(accounts)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning();

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    // Get all unique category/date combinations from transactions before deleting
    const deletedTransactions = await db
      .select({
        categoryId: transactions.categoryId,
        date: transactions.date,
      })
      .from(transactions)
      .where(and(
        eq(transactions.accountId, id),
        sql`${transactions.categoryId} IS NOT NULL`
      ));

    // Cascade soft delete all transactions for this account
    await db
      .update(transactions)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(transactions.accountId, id), isNull(transactions.deletedAt)));

    // Cascade soft delete all account connections for this account
    await db
      .update(accountConnections)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(accountConnections.accountId, id), isNull(accountConnections.deletedAt)));

    // Recalculate budget activity for each affected category/month
    for (const txn of deletedTransactions) {
      if (txn.categoryId && txn.date) {
        await updateBudgetActivityForTransaction(
          txn.categoryId,
          txn.date
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete account' } },
      { status: 500 }
    );
  }
}
