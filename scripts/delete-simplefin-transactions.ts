/**
 * Delete SimpleFin Transactions Script
 *
 * This script deletes all transactions that were imported from SimpleFin.
 * This is necessary after fixing the currency conversion bug where SimpleFin
 * transactions were stored with amounts 100x too small.
 *
 * After running this script, you should re-sync your SimpleFin accounts to
 * re-import transactions with the correct amounts.
 *
 * Usage:
 *   npx tsx scripts/delete-simplefin-transactions.ts
 *
 * IMPORTANT: This will delete all SimpleFin transactions. Make sure you have
 * a database backup before running this script.
 */

import { db } from '../src/db';
import { transactions, accounts } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function deleteSimpleFinTransactions() {
  console.log('🔍 Finding SimpleFin transactions...');

  // Find all SimpleFin transactions
  const simpleFinTransactions = await db
    .select()
    .from(transactions)
    .where(sql`${transactions.importId} LIKE 'simplefin:%'`);

  console.log(`📊 Found ${simpleFinTransactions.length} SimpleFin transactions`);

  if (simpleFinTransactions.length === 0) {
    console.log('✅ No SimpleFin transactions to delete');
    return;
  }

  // Group by account to show summary
  const byAccount = simpleFinTransactions.reduce((acc, txn) => {
    const accountId = txn.accountId;
    if (!acc[accountId]) {
      acc[accountId] = {
        count: 0,
        totalAmount: 0,
      };
    }
    acc[accountId].count++;
    acc[accountId].totalAmount += txn.amount;
    return acc;
  }, {} as Record<string, { count: number; totalAmount: number }>);

  console.log('\n📋 Transactions by account:');
  for (const [accountId, stats] of Object.entries(byAccount)) {
    console.log(`  Account ${accountId}: ${stats.count} transactions, total impact: ${stats.totalAmount} cents`);
  }

  console.log('\n⚠️  WARNING: This will delete all SimpleFin transactions.');
  console.log('💾 Make sure you have a database backup before proceeding.');
  console.log('\nTo proceed, uncomment the deletion code below.');
  console.log('\n❌ Deletion code is commented out for safety.');
  console.log('   Edit this script and uncomment the deletion block to proceed.\n');

  // Uncomment the code below to actually delete the transactions
  /*
  console.log('\n🗑️  Deleting SimpleFin transactions...');

  const result = await db
    .delete(transactions)
    .where(sql`${transactions.importId} LIKE 'simplefin:%'`)
    .returning({ id: transactions.id });

  console.log(`✅ Deleted ${result.length} SimpleFin transactions`);

  console.log('\n📝 Next steps:');
  console.log('1. Go to your SimpleFin connected accounts');
  console.log('2. Trigger a sync to re-import transactions');
  console.log('3. Verify amounts are now displaying correctly (e.g., $1,336.89 instead of $13.37)');
  console.log('4. Check account balances are correct');
  */

  console.log('\n⏭️  Skipped deletion (code is commented out)');
}

// Run the script
deleteSimpleFinTransactions()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
