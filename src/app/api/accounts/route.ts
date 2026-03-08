import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(accounts)
      .where(isNull(accounts.deletedAt))
      .orderBy(accounts.sortOrder);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch accounts' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [account] = await db
      .insert(accounts)
      .values({
        name: body.name,
        accountType: body.accountType,
        balance: body.balance ?? 0,
        clearedBalance: body.clearedBalance ?? 0,
        unclearedBalance: body.unclearedBalance ?? 0,
        isOnBudget: body.isOnBudget ?? true,
        note: body.note,
      })
      .returning();

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create account' } },
      { status: 500 }
    );
  }
}
