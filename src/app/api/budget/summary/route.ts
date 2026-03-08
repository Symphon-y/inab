import { NextResponse } from 'next/server';
import { db } from '@/db';
import { budgetAllocations, transactions, accounts } from '@/db/schema';
import { eq, and, gte, lt, sql, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Valid year and month (1-12) are required' } },
        { status: 400 }
      );
    }

    // Create date range for the month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    // Get total assigned for the month
    const assignedResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${budgetAllocations.assigned}), 0)`,
      })
      .from(budgetAllocations)
      .where(eq(budgetAllocations.month, monthStart));

    const totalAssigned = Number(assignedResult[0]?.total || 0);

    // Get total income for the month (positive transactions to budget accounts)
    const incomeResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          gte(transactions.date, monthStart),
          lt(transactions.date, monthEnd),
          eq(accounts.isOnBudget, true),
          sql`${transactions.amount} > 0`,
          isNull(transactions.deletedAt)
        )
      );

    const totalIncome = Number(incomeResult[0]?.total || 0);

    // Calculate Ready to Assign
    const readyToAssign = totalIncome - totalAssigned;

    // Get activity total (spending) for the month
    const activityResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${budgetAllocations.activity}), 0)`,
      })
      .from(budgetAllocations)
      .where(eq(budgetAllocations.month, monthStart));

    const totalActivity = Number(activityResult[0]?.total || 0);

    return NextResponse.json({
      year,
      month,
      readyToAssign,
      totalIncome,
      totalAssigned,
      totalActivity,
    });
  } catch (error) {
    console.error('Failed to fetch budget summary:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch budget summary' } },
      { status: 500 }
    );
  }
}
