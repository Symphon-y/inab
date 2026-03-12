import { NextResponse } from 'next/server';
import { db } from '@/db';
import { budgetAllocations, categories } from '@/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { calculateCarryover } from '@/lib/budget';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Valid year and month (1-12) are required' } },
        { status: 400 }
      );
    }

    // Create date for the first day of the month
    const monthDate = new Date(year, month - 1, 1);

    const allocations = await db
      .select({
        id: budgetAllocations.id,
        categoryId: budgetAllocations.categoryId,
        month: budgetAllocations.month,
        assigned: budgetAllocations.assigned,
        activity: budgetAllocations.activity,
        available: budgetAllocations.available,
        carryover: budgetAllocations.carryover,
        createdAt: budgetAllocations.createdAt,
        updatedAt: budgetAllocations.updatedAt,
      })
      .from(budgetAllocations)
      .innerJoin(categories, eq(budgetAllocations.categoryId, categories.id))
      .where(and(
        eq(budgetAllocations.month, monthDate),
        isNull(categories.deletedAt)
      ));

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Failed to fetch budget allocations:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch budget allocations' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, year, month, assigned } = body;

    if (!categoryId || !year || !month || assigned === undefined) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'categoryId, year, month, and assigned are required' } },
        { status: 400 }
      );
    }

    // Validate category exists and is not deleted
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)));

    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found or deleted' } },
        { status: 404 }
      );
    }

    // Create date for the first day of the month
    const monthDate = new Date(year, month - 1, 1);

    // Calculate carryover from previous month
    const carryover = await calculateCarryover(categoryId, year, month);

    // Check if allocation already exists
    const [existing] = await db
      .select()
      .from(budgetAllocations)
      .where(
        and(
          eq(budgetAllocations.categoryId, categoryId),
          eq(budgetAllocations.month, monthDate)
        )
      );

    let allocation;

    if (existing) {
      // Update existing allocation
      const newAssigned = assigned; // Amount in cents
      const newAvailable = carryover + newAssigned + existing.activity;

      [allocation] = await db
        .update(budgetAllocations)
        .set({
          assigned: newAssigned,
          carryover,
          available: newAvailable,
          updatedAt: new Date(),
        })
        .where(eq(budgetAllocations.id, existing.id))
        .returning();
    } else {
      // Create new allocation with calculated carryover
      const newAssigned = assigned;
      const newAvailable = carryover + newAssigned; // Carryover + assigned

      [allocation] = await db
        .insert(budgetAllocations)
        .values({
          categoryId,
          month: monthDate,
          assigned: newAssigned,
          activity: 0,
          available: newAvailable,
          carryover,
        })
        .returning();
    }

    return NextResponse.json(allocation, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Failed to create/update budget allocation:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create/update budget allocation' } },
      { status: 500 }
    );
  }
}
