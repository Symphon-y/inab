import { db } from '@/db';
import { transactions, budgetAllocations, accounts } from '@/db/schema';
import { eq, and, gte, lt, sql, isNull } from 'drizzle-orm';

/**
 * Calculate carryover from previous month's available balance
 * @param categoryId - The category ID
 * @param year - Current year
 * @param month - Current month (1-12)
 * @returns Previous month's available balance, or 0 if no previous allocation exists
 */
export async function calculateCarryover(
  categoryId: string,
  year: number,
  month: number
): Promise<number> {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthDate = new Date(prevYear, prevMonth - 1, 1);

  const [prevAllocation] = await db
    .select()
    .from(budgetAllocations)
    .where(
      and(
        eq(budgetAllocations.categoryId, categoryId),
        eq(budgetAllocations.month, prevMonthDate)
      )
    );

  return prevAllocation?.available || 0;
}

/**
 * Recalculate budget allocation activity for a specific category and month
 * Activity = sum of all negative (outflow) transactions in the month for that category
 */
export async function updateBudgetActivity(categoryId: string, year: number, month: number) {
  // Create date range for the month
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  // Calculate activity: sum of outflows (negative amounts) for this category in this month
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(transactions.categoryId, categoryId),
        gte(transactions.date, monthStart),
        lt(transactions.date, monthEnd),
        eq(accounts.isOnBudget, true), // Only count transactions in budget accounts
        isNull(transactions.deletedAt),
        isNull(accounts.deletedAt)
      )
    );

  const activity = Number(result[0]?.total || 0);

  // Calculate carryover from previous month
  const carryover = await calculateCarryover(categoryId, year, month);

  // Check if allocation exists for this category/month
  const [existingAllocation] = await db
    .select()
    .from(budgetAllocations)
    .where(
      and(
        eq(budgetAllocations.categoryId, categoryId),
        eq(budgetAllocations.month, monthStart)
      )
    );

  if (existingAllocation) {
    // Update existing allocation with recalculated carryover
    const newAvailable = carryover + existingAllocation.assigned + activity;

    await db
      .update(budgetAllocations)
      .set({
        activity,
        carryover,
        available: newAvailable,
        updatedAt: new Date(),
      })
      .where(eq(budgetAllocations.id, existingAllocation.id));
  } else if (activity !== 0 || carryover !== 0) {
    // Create new allocation if there's activity (spending) or carryover
    const newAvailable = carryover + activity;
    await db.insert(budgetAllocations).values({
      categoryId,
      month: monthStart,
      assigned: 0,
      activity,
      available: newAvailable,
      carryover,
    });
  }
}

/**
 * Update budget activity for multiple categories affected by a transaction change
 */
export async function updateBudgetActivityForTransaction(
  categoryId: string | null | undefined,
  date: Date,
  oldCategoryId?: string | null,
  oldDate?: Date
) {
  const transactionDate = new Date(date);
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth() + 1;

  // Update activity for the new category/month
  if (categoryId) {
    await updateBudgetActivity(categoryId, year, month);
  }

  // If category or date changed, update the old category/month too
  if (oldCategoryId && oldCategoryId !== categoryId) {
    const oldTransactionDate = oldDate ? new Date(oldDate) : transactionDate;
    const oldYear = oldTransactionDate.getFullYear();
    const oldMonth = oldTransactionDate.getMonth() + 1;
    await updateBudgetActivity(oldCategoryId, oldYear, oldMonth);
  } else if (oldDate && oldDate.getTime() !== date.getTime()) {
    // Date changed but category stayed the same
    const oldYear = new Date(oldDate).getFullYear();
    const oldMonth = new Date(oldDate).getMonth() + 1;
    if (categoryId && (oldYear !== year || oldMonth !== month)) {
      await updateBudgetActivity(categoryId, oldYear, oldMonth);
    }
  }
}
