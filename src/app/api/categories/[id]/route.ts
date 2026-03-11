import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)));

    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch category' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [category] = await db
      .update(categories)
      .set({
        name: body.name,
        icon: body.icon,
        categoryGroupId: body.categoryGroupId,
        sortOrder: body.sortOrder,
        isHidden: body.isHidden,
        note: body.note,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update category' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [category] = await db
      .update(categories)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete category' } },
      { status: 500 }
    );
  }
}
