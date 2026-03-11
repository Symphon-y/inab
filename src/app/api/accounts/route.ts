import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { getActivePlanId } from '@/lib/plan-context';

export async function GET() {
  try {
    const planId = await getActivePlanId();

    const data = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.planId, planId),
        isNull(accounts.deletedAt)
      ))
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
    const planId = await getActivePlanId();
    const body = await request.json();

    const [account] = await db
      .insert(accounts)
      .values({
        planId,
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
