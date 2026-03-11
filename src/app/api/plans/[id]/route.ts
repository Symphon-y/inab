import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, id), isNull(plans.deletedAt)));

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to fetch plan:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch plan' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.lastUsedAt !== undefined) updateData.lastUsedAt = new Date(body.lastUsedAt);
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const [plan] = await db
      .update(plans)
      .set(updateData)
      .where(and(eq(plans.id, id), isNull(plans.deletedAt)))
      .returning();

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to update plan:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update plan' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [plan] = await db
      .update(plans)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(plans.id, id), isNull(plans.deletedAt)))
      .returning();

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete plan' } },
      { status: 500 }
    );
  }
}
