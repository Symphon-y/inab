import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(goals)
      .where(isNull(goals.deletedAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch goals' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [goal] = await db
      .insert(goals)
      .values({
        categoryId: body.categoryId,
        goalType: body.goalType,
        targetAmount: body.targetAmount,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        monthlyFunding: body.monthlyFunding,
      })
      .returning();

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create goal' } },
      { status: 500 }
    );
  }
}
