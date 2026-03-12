import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, accountConnections } from '@/db/schema';
import { eq, isNull, sql, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Query accounts with left join to connections
    const accountsWithConnections = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        accountType: accounts.accountType,
        balance: accounts.balance,
        clearedBalance: accounts.clearedBalance,
        unclearedBalance: accounts.unclearedBalance,
        isOnBudget: accounts.isOnBudget,
        isClosed: accounts.isClosed,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        hasConnection: sql<boolean>`${accountConnections.id} IS NOT NULL`,
        lastSyncAt: accountConnections.lastSyncAt,
      })
      .from(accounts)
      .leftJoin(
        accountConnections,
        and(
          eq(accounts.id, accountConnections.accountId),
          eq(accountConnections.status, 'active'),
          isNull(accountConnections.deletedAt)
        )
      )
      .where(isNull(accounts.deletedAt));

    return NextResponse.json(accountsWithConnections);
  } catch (error) {
    console.error('Failed to fetch accounts with connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
