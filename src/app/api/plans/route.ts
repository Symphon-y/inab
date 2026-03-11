import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, categoryGroups, categories } from '@/db/schema';
import { isNull, desc } from 'drizzle-orm';
import { DEFAULT_CATEGORY_GROUPS } from '@/lib/default-categories';

export async function GET() {
  try {
    const allPlans = await db
      .select()
      .from(plans)
      .where(isNull(plans.deletedAt))
      .orderBy(desc(plans.lastUsedAt));

    return NextResponse.json(allPlans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch plans' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create plan
    const [plan] = await db
      .insert(plans)
      .values({
        name: body.name,
        icon: body.icon || '💰',
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();

    // Auto-populate with default categories
    for (const defaultGroup of DEFAULT_CATEGORY_GROUPS) {
      const [newGroup] = await db
        .insert(categoryGroups)
        .values({
          planId: plan.id,
          name: defaultGroup.name,
          sortOrder: defaultGroup.sortOrder,
        })
        .returning();

      await db.insert(categories).values(
        defaultGroup.categories.map((cat) => ({
          categoryGroupId: newGroup.id,
          name: cat.name,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
        }))
      );
    }

    console.log(`Created plan "${plan.name}" with default categories`);

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create plan' } },
      { status: 500 }
    );
  }
}
