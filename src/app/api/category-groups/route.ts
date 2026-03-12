import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categoryGroups, categories } from '@/db/schema';
import { eq, isNull, asc, and } from 'drizzle-orm';
import { getActivePlanId } from '@/lib/plan-context';

export async function GET() {
  try {
    const planId = await getActivePlanId();

    const groups = await db
      .select()
      .from(categoryGroups)
      .where(and(
        eq(categoryGroups.planId, planId),
        isNull(categoryGroups.deletedAt)
      ))
      .orderBy(asc(categoryGroups.sortOrder));

    // Fetch categories for each group
    const groupsWithCategories = await Promise.all(
      groups.map(async (group) => {
        const groupCategories = await db
          .select()
          .from(categories)
          .where(and(
            eq(categories.categoryGroupId, group.id),
            isNull(categories.deletedAt)
          ))
          .orderBy(asc(categories.sortOrder));

        return {
          ...group,
          categories: groupCategories,
        };
      })
    );

    return NextResponse.json(groupsWithCategories);
  } catch (error) {
    console.error('Failed to fetch category groups:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch category groups' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const planId = await getActivePlanId();
    const body = await request.json();

    const [group] = await db
      .insert(categoryGroups)
      .values({
        planId,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json({ ...group, categories: [] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create category group:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create category group' } },
      { status: 500 }
    );
  }
}
