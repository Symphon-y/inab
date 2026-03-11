import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { eq, and, gte, lt, isNull, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'startDate and endDate are required' } },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Add one day to end date to include transactions on the end date
    end.setDate(end.getDate() + 1);

    // Calculate monthly income and expenses
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        expense: sql<number>`ABS(COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END), 0))`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          gte(transactions.date, start),
          lt(transactions.date, end),
          eq(accounts.isOnBudget, true),
          isNull(transactions.deletedAt)
        )
      )
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`);

    const data = monthlyData.map((item) => ({
      month: item.month,
      income: Number(item.income),
      expense: Number(item.expense),
      netSavings: Number(item.income) - Number(item.expense),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch income vs expense report:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch income vs expense report' } },
      { status: 500 }
    );
  }
}
