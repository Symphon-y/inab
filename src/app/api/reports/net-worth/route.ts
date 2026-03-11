import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('accountType') || 'all'; // 'all' or 'budget'

    // For now, we'll return current net worth snapshot
    // In the future, we could track historical snapshots
    let query = db
      .select()
      .from(accounts)
      .where(isNull(accounts.deletedAt));

    if (accountType === 'budget') {
      query = db
        .select()
        .from(accounts)
        .where(and(eq(accounts.isOnBudget, true), isNull(accounts.deletedAt)));
    }

    const accountsData = await query;

    // Calculate total net worth
    const netWorth = accountsData.reduce((sum, account) => sum + account.balance, 0);

    // For now, return a simple snapshot
    // TODO: Track historical data points
    const data = {
      current: netWorth,
      accounts: accountsData.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        type: account.accountType,
      })),
      // Placeholder for historical data
      history: [
        {
          date: new Date().toISOString(),
          value: netWorth,
        },
      ],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch net worth report:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch net worth report' } },
      { status: 500 }
    );
  }
}
