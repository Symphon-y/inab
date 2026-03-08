import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), isNull(goals.deletedAt)));

    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to fetch goal:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch goal' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [goal] = await db
      .update(goals)
      .set({
        goalType: body.goalType,
        targetAmount: body.targetAmount,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        monthlyFunding: body.monthlyFunding,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(goals.id, id), isNull(goals.deletedAt)))
      .returning();

    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update goal' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [goal] = await db
      .update(goals)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(goals.id, id), isNull(goals.deletedAt)))
      .returning();

    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete goal' } },
      { status: 500 }
    );
  }
}
