import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accountConnections, importSyncLogs } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;

    const [connection] = await db
      .select({
        id: accountConnections.id,
        provider: accountConnections.provider,
        externalAccountId: accountConnections.externalAccountId,
        status: accountConnections.status,
        lastSyncAt: accountConnections.lastSyncAt,
        lastSyncStatus: accountConnections.lastSyncStatus,
        lastError: accountConnections.lastError,
        syncStartDate: accountConnections.syncStartDate,
        createdAt: accountConnections.createdAt,
        updatedAt: accountConnections.updatedAt,
      })
      .from(accountConnections)
      .where(and(eq(accountConnections.accountId, accountId), isNull(accountConnections.deletedAt)));

    if (!connection) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No connection found' } }, { status: 404 });
    }

    // Get recent sync logs
    const logs = await db
      .select()
      .from(importSyncLogs)
      .where(eq(importSyncLogs.connectionId, connection.id))
      .orderBy(desc(importSyncLogs.startedAt))
      .limit(10);

    return NextResponse.json({
      connection,
      recentSyncs: logs,
    });
  } catch (error) {
    console.error('Failed to fetch connection:', error);
    return NextResponse.json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch connection' } }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;

    const [connection] = await db
      .update(accountConnections)
      .set({
        status: 'disconnected',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(accountConnections.accountId, accountId), isNull(accountConnections.deletedAt)))
      .returning();

    if (!connection) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No connection found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect:', error);
    return NextResponse.json({ error: { code: 'DISCONNECT_ERROR', message: 'Failed to disconnect' } }, { status: 500 });
  }
}
