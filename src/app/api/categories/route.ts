import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { isNull, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(categories)
      .where(isNull(categories.deletedAt))
      .orderBy(asc(categories.sortOrder));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch categories' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [category] = await db
      .insert(categories)
      .values({
        categoryGroupId: body.categoryGroupId,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
        note: body.note,
      })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create category' } },
      { status: 500 }
    );
  }
}
