import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, categories, categoryGroups, accounts } from '@/db/schema';
import { eq, and, gte, lt, isNull, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'category'; // 'category' or 'payee'

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

    if (groupBy === 'payee') {
      // Group by payee
      const spendingByPayee = await db
        .select({
          name: transactions.payee,
          amount: sql<number>`ABS(COALESCE(SUM(${transactions.amount}), 0))`,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            gte(transactions.date, start),
            lt(transactions.date, end),
            eq(accounts.isOnBudget, true),
            sql`${transactions.amount} < 0`, // Only outflows (spending)
            isNull(transactions.deletedAt)
          )
        )
        .groupBy(transactions.payee);

      const data = spendingByPayee.map((item) => ({
        name: item.name || 'Uncategorized',
        value: Number(item.amount),
      }));

      return NextResponse.json(data);
    } else {
      // Group by category (default)
      const spendingByCategory = await db
        .select({
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          groupName: categoryGroups.name,
          amount: sql<number>`ABS(COALESCE(SUM(${transactions.amount}), 0))`,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(categoryGroups, eq(categories.categoryGroupId, categoryGroups.id))
        .where(
          and(
            gte(transactions.date, start),
            lt(transactions.date, end),
            eq(accounts.isOnBudget, true),
            sql`${transactions.amount} < 0`, // Only outflows (spending)
            isNull(transactions.deletedAt)
          )
        )
        .groupBy(transactions.categoryId, categories.name, categoryGroups.name);

      const data = spendingByCategory.map((item) => ({
        id: item.categoryId,
        name: item.categoryName || 'Uncategorized',
        group: item.groupName || 'Other',
        value: Number(item.amount),
      }));

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Failed to fetch spending report:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch spending report' } },
      { status: 500 }
    );
  }
}
