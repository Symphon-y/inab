import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, accountConnections } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';
import { testSimpleFinConnection } from '@/lib/bank-integrations/simplefin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ConnectRequestBody {
  provider: 'simplefin' | 'manual';
  credentials: {
    accessUrl?: string; // For SimpleFin
  };
  externalAccountId: string;
  syncStartDate?: string; // ISO date string
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: accountId } = await params;
    const body = (await request.json()) as ConnectRequestBody;

    const { provider, credentials, externalAccountId, syncStartDate } = body;

    // Validate required fields
    if (!provider || !credentials || !externalAccountId) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Provider, credentials, and externalAccountId are required' } },
        { status: 400 }
      );
    }

    // Validate account exists
    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, accountId), isNull(accounts.deletedAt)));

    if (!account) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    // Test connection before storing
    let isValid = false;
    if (provider === 'simplefin') {
      if (!credentials.accessUrl) {
        return NextResponse.json(
          { error: { code: 'MISSING_ACCESS_URL', message: 'SimpleFin access URL is required' } },
          { status: 400 }
        );
      }
      isValid = await testSimpleFinConnection(credentials.accessUrl);
    } else if (provider === 'manual') {
      // Manual provider doesn't need validation (for CSV imports)
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Could not connect to bank. Please check your credentials.' } },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Check if connection already exists for this account
    const [existing] = await db
      .select()
      .from(accountConnections)
      .where(and(eq(accountConnections.accountId, accountId), isNull(accountConnections.deletedAt)));

    if (existing) {
      // Update existing connection
      const [updated] = await db
        .update(accountConnections)
        .set({
          provider,
          encryptedCredentials,
          externalAccountId,
          syncStartDate: syncStartDate ? new Date(syncStartDate) : null,
          status: 'active',
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(accountConnections.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    }

    // Create new connection
    const [connection] = await db
      .insert(accountConnections)
      .values({
        accountId,
        provider,
        encryptedCredentials,
        externalAccountId,
        syncStartDate: syncStartDate ? new Date(syncStartDate) : null,
        status: 'active',
      })
      .returning();

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error('Failed to connect account:', error);
    return NextResponse.json(
      { error: { code: 'CONNECT_ERROR', message: 'Failed to connect account' } },
      { status: 500 }
    );
  }
}
