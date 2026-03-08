import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch account' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [account] = await db
      .update(accounts)
      .set({
        name: body.name,
        accountType: body.accountType,
        isOnBudget: body.isOnBudget,
        isClosed: body.isClosed,
        note: body.note,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning();

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update account' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Soft delete
    const [account] = await db
      .update(accounts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning();

    if (!account) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete account' } },
      { status: 500 }
    );
  }
}
