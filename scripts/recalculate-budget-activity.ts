/**
 * Recalculate Budget Activity Script
 *
 * This script recalculates budget activity for all categories that have
 * transactions. This is needed after running the cleanup script which
 * soft-deleted orphaned transactions without updating budget allocations.
 *
 * Run with: npx tsx scripts/recalculate-budget-activity.ts
 */

import { db } from '../src/db';
import { transactions, accounts, budgetAllocations } from '../src/db/schema';
import { sql, isNull, eq, and, gte, lt } from 'drizzle-orm';
import { updateBudgetActivity } from '../src/lib/budget';

async function recalculateBudgetActivity() {
  console.log('Starting budget activity recalculation...\n');

  try {
    // Get all unique category/month combinations from transactions
    const categoryMonths = await db
      .selectDistinct({
        categoryId: transactions.categoryId,
        year: sql<number>`EXTRACT(YEAR FROM ${transactions.date})`,
        month: sql<number>`EXTRACT(MONTH FROM ${transactions.date})`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          sql`${transactions.categoryId} IS NOT NULL`,
          eq(accounts.isOnBudget, true),
          isNull(transactions.deletedAt),
          isNull(accounts.deletedAt)
        )
      );

    console.log(`Found ${categoryMonths.length} category/month combinations to recalculate\n`);

    let processed = 0;
    let errors = 0;

    for (const { categoryId, year, month } of categoryMonths) {
      if (!categoryId || !year || !month) continue;

      try {
        await updateBudgetActivity(categoryId, year, month);
        processed++;

        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${categoryMonths.length}...`);
        }
      } catch (error) {
        errors++;
        console.error(`Error recalculating for category ${categoryId}, ${year}-${month}:`, error);
      }
    }

    console.log(`\n✅ Recalculation complete!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Errors: ${errors}`);

    // Show summary of budget allocations
    const summary = await db
      .select({
        totalAssigned: sql<number>`COALESCE(SUM(${budgetAllocations.assigned}), 0)`,
        totalActivity: sql<number>`COALESCE(SUM(${budgetAllocations.activity}), 0)`,
        totalAvailable: sql<number>`COALESCE(SUM(${budgetAllocations.available}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(budgetAllocations);

    console.log(`\n📊 Budget Summary:`);
    console.log(`   Total Allocations: ${summary[0]?.count || 0}`);
    console.log(`   Total Assigned: $${((summary[0]?.totalAssigned || 0) / 100).toFixed(2)}`);
    console.log(`   Total Activity: $${((summary[0]?.totalActivity || 0) / 100).toFixed(2)}`);
    console.log(`   Total Available: $${((summary[0]?.totalAvailable || 0) / 100).toFixed(2)}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

recalculateBudgetActivity()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
