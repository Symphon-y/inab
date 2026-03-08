import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { eq, isNull, desc, and, sql } from 'drizzle-orm';
import { updateBudgetActivityForTransaction } from '@/lib/budget';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    let query = db
      .select()
      .from(transactions)
      .where(isNull(transactions.deletedAt))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    if (accountId) {
      query = db
        .select()
        .from(transactions)
        .where(and(eq(transactions.accountId, accountId), isNull(transactions.deletedAt)))
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const data = await query;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch transactions' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = body.amount; // Already in cents, negative for outflow

    // Create the transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        accountId: body.accountId,
        categoryId: body.categoryId,
        payee: body.payee,
        amount,
        date: new Date(body.date),
        memo: body.memo,
        status: body.status ?? 'uncleared',
        flag: body.flag ?? 'none',
      })
      .returning();

    // Update account balance using sql template
    if (body.status === 'cleared') {
      await db
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${amount}`,
          clearedBalance: sql`${accounts.clearedBalance} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, body.accountId));
    } else {
      await db
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${amount}`,
          unclearedBalance: sql`${accounts.unclearedBalance} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, body.accountId));
    }

    // Update budget allocation activity if transaction is categorized
    if (body.categoryId) {
      await updateBudgetActivityForTransaction(
        body.categoryId,
        new Date(body.date)
      );
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create transaction' } },
      { status: 500 }
    );
  }
}
