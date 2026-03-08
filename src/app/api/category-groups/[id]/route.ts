import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categoryGroups, categories } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [group] = await db
      .select()
      .from(categoryGroups)
      .where(and(eq(categoryGroups.id, id), isNull(categoryGroups.deletedAt)));

    if (!group) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category group not found' } },
        { status: 404 }
      );
    }

    const groupCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.categoryGroupId, id), isNull(categories.deletedAt)));

    return NextResponse.json({ ...group, categories: groupCategories });
  } catch (error) {
    console.error('Failed to fetch category group:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch category group' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [group] = await db
      .update(categoryGroups)
      .set({
        name: body.name,
        sortOrder: body.sortOrder,
        isHidden: body.isHidden,
        updatedAt: new Date(),
      })
      .where(and(eq(categoryGroups.id, id), isNull(categoryGroups.deletedAt)))
      .returning();

    if (!group) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category group not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Failed to update category group:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update category group' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const now = new Date();

    // Soft delete the group
    const [group] = await db
      .update(categoryGroups)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(categoryGroups.id, id), isNull(categoryGroups.deletedAt)))
      .returning();

    if (!group) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category group not found' } },
        { status: 404 }
      );
    }

    // Also soft delete all categories in this group
    await db
      .update(categories)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(categories.categoryGroupId, id), isNull(categories.deletedAt)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete category group:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete category group' } },
      { status: 500 }
    );
  }
}
