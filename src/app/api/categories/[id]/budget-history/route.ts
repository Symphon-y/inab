import { NextResponse } from 'next/server';
import { db } from '@/db';
import { budgetAllocations, transactions, accounts } from '@/db/schema';
import { eq, and, gte, lt, sql, isNull } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    const { id: categoryId } = await params;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Valid year and month (1-12) are required' } },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const currentMonthDate = new Date(year, month - 1, 1);
    const currentMonthEnd = new Date(year, month, 1);

    // Last month
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastMonthDate = new Date(lastYear, lastMonth - 1, 1);

    // Last 3 months for averages (including current month)
    const threeMonthsAgo = new Date(year, month - 4, 1);

    // Fetch last month's allocation
    const [lastMonthAllocation] = await db
      .select()
      .from(budgetAllocations)
      .where(
        and(
          eq(budgetAllocations.categoryId, categoryId),
          eq(budgetAllocations.month, lastMonthDate)
        )
      );

    // Fetch last 3 months of allocations for averages
    const historicalAllocations = await db
      .select()
      .from(budgetAllocations)
      .where(
        and(
          eq(budgetAllocations.categoryId, categoryId),
          gte(budgetAllocations.month, threeMonthsAgo),
          lt(budgetAllocations.month, currentMonthDate)
        )
      );

    // Calculate averages
    const averageAssigned = historicalAllocations.length > 0
      ? Math.round(
          historicalAllocations.reduce((sum, alloc) => sum + alloc.assigned, 0) /
            historicalAllocations.length
        )
      : 0;

    // Average spent = average of absolute value of negative activity
    const averageSpent = historicalAllocations.length > 0
      ? Math.round(
          historicalAllocations.reduce((sum, alloc) => sum + Math.abs(Math.min(alloc.activity, 0)), 0) /
            historicalAllocations.length
        )
      : 0;

    // Fetch current month's transactions split by account type
    const cashSpendingResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.categoryId, categoryId),
          gte(transactions.date, currentMonthDate),
          lt(transactions.date, currentMonthEnd),
          eq(accounts.isOnBudget, true),
          isNull(transactions.deletedAt),
          sql`${accounts.accountType} != 'credit_card'`
        )
      );

    const creditSpendingResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.categoryId, categoryId),
          gte(transactions.date, currentMonthDate),
          lt(transactions.date, currentMonthEnd),
          eq(accounts.isOnBudget, true),
          isNull(transactions.deletedAt),
          eq(accounts.accountType, 'credit_card')
        )
      );

    const cashSpending = Number(cashSpendingResult[0]?.total || 0);
    const creditSpending = Number(creditSpendingResult[0]?.total || 0);

    return NextResponse.json({
      lastMonth: {
        assigned: lastMonthAllocation?.assigned || 0,
        activity: lastMonthAllocation?.activity || 0,
        available: lastMonthAllocation?.available || 0,
      },
      averages: {
        averageAssigned,
        averageSpent,
      },
      currentMonth: {
        cashSpending,
        creditSpending,
      },
    });
  } catch (error) {
    console.error('Failed to fetch budget history:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch budget history' } },
      { status: 500 }
    );
  }
}
