import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accountConnections } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { importTransactionsForAccount } from '@/lib/import/transaction-importer';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;

    // Find connection for this account
    const [connection] = await db
      .select()
      .from(accountConnections)
      .where(and(eq(accountConnections.accountId, accountId), isNull(accountConnections.deletedAt)));

    if (!connection) {
      return NextResponse.json(
        { error: { code: 'NOT_CONNECTED', message: 'Account is not connected to a bank' } },
        { status: 400 }
      );
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'CONNECTION_INACTIVE', message: 'Connection is not active. Please reconnect.' } },
        { status: 400 }
      );
    }

    // Trigger import
    console.log(`🔄 Starting sync for account ${accountId}, connection ${connection.id}`);
    const result = await importTransactionsForAccount(connection.id);
    console.log(`✅ Sync completed:`, result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Failed to sync account:', error);
    return NextResponse.json(
      { error: { code: 'SYNC_ERROR', message: error instanceof Error ? error.message : 'Failed to sync account' } },
      { status: 500 }
    );
  }
}
