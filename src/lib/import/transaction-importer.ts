import { db } from '@/db';
import { transactions, accounts, accountConnections, importSyncLogs } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { fetchSimpleFinData } from '@/lib/bank-integrations/simplefin';
import { updateBudgetActivityForTransaction } from '@/lib/budget';
import { parseSimpleFinAmount } from '@/lib/currency';
import type { AccountConnection } from '@/db/schema';

/**
 * Imported transaction mapped to internal schema
 */
interface ImportedTransaction {
  externalId: string; // Provider's transaction ID
  date: Date;
  amount: number; // In cents (negative for outflow, positive for inflow)
  payee: string;
  memo?: string;
  status: 'cleared' | 'uncleared';
}

/**
 * Provider data including transactions and balance
 */
interface ProviderData {
  transactions: ImportedTransaction[];
  balance?: number; // Balance in cents (already converted)
}

/**
 * Result of import operation
 */
export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Generate unique import ID combining provider, account, and external ID
 * @param provider - The provider name (simplefin, manual)
 * @param externalAccountId - Provider's account ID
 * @param externalId - Provider's transaction ID
 * @returns Unique import ID for deduplication
 * @example generateImportId('simplefin', 'acc-123', 'txn-12345') => 'simplefin:acc-123:txn-12345'
 */
function generateImportId(provider: string, externalAccountId: string, externalId: string): string {
  return `${provider}:${externalAccountId}:${externalId}`;
}

/**
 * Create a starting balance transaction for a newly connected account
 * @param accountId - Internal account ID
 * @param externalAccountId - Provider's account ID
 * @param simpleFinBalance - Account balance in cents
 * @param syncStartDate - Date to set as transaction date
 */
async function createStartingBalanceTransaction(
  accountId: string,
  externalAccountId: string,
  simpleFinBalance: number,
  syncStartDate: Date
): Promise<void> {
  const importId = generateImportId('simplefin', externalAccountId, 'starting-balance');

  // Check if starting balance already exists
  const existing = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.accountId, accountId),
      eq(transactions.importId, importId)
    ))
    .limit(1);

  if (existing.length > 0) {
    console.log('Starting balance transaction already exists');
    return;
  }

  // Create starting balance transaction
  await db.insert(transactions).values({
    accountId,
    payee: 'Starting Balance',
    amount: simpleFinBalance,
    date: syncStartDate,
    status: 'reconciled',
    memo: 'Initial balance from SimpleFin',
    importId,
  });

  console.log(`Created starting balance transaction: ${simpleFinBalance} cents`);
}

/**
 * Fetch transactions and balance from the appropriate provider
 * @param connection - Account connection with encrypted credentials
 * @returns Provider data including transactions and balance
 */
async function fetchTransactionsFromProvider(
  connection: AccountConnection
): Promise<ProviderData> {
  const sinceDate = connection.syncStartDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days default

  if (connection.provider === 'simplefin') {
    console.log(`Fetching SimpleFin data since ${sinceDate.toISOString()}`);
    const accounts = await fetchSimpleFinData(connection.encryptedCredentials, sinceDate);
    console.log(`SimpleFin returned ${accounts.length} accounts`);

    const account = accounts.find((a) => a.id === connection.externalAccountId);

    if (!account) {
      throw new Error('Account not found at SimpleFIN');
    }

    console.log(`Found account ${account.id} with ${account.transactions.length} transactions`);

    const transactions = account.transactions.map((txn) => ({
      externalId: txn.id,
      date: new Date(txn.posted * 1000),
      amount: parseSimpleFinAmount(txn.amount), // Convert SimpleFin dollars to cents
      payee: txn.payee || txn.description,
      memo: txn.memo,
      status: 'cleared' as const, // SimpleFIN only returns posted transactions
    }));

    const balanceInCents = parseSimpleFinAmount(account.balance);

    console.log(`SimpleFin account ${account.id}: balance=${account.balance} (raw) -> ${balanceInCents} cents`);

    return {
      transactions,
      balance: balanceInCents,
    };
  }

  throw new Error(`Unsupported provider: ${connection.provider}`);
}

/**
 * Import transactions for a connected account
 *
 * This function:
 * 1. Fetches transactions from SimpleFin
 * 2. Deduplicates using importId field
 * 3. Updates account balances atomically
 * 4. Updates budget activity for categorized transactions
 * 5. Logs import results for audit trail
 *
 * @param connectionId - The account connection ID
 * @returns Import result with counts and errors
 * @throws {Error} If connection not found or provider not supported
 *
 * @example
 * const result = await importTransactionsForAccount(connectionId);
 * console.log(`Imported: ${result.imported}, Updated: ${result.updated}`);
 */
export async function importTransactionsForAccount(
  connectionId: string
): Promise<ImportResult> {
  // Fetch connection
  const [connection] = await db
    .select()
    .from(accountConnections)
    .where(and(eq(accountConnections.id, connectionId), isNull(accountConnections.deletedAt)));

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Create sync log
  const [syncLog] = await db
    .insert(importSyncLogs)
    .values({
      connectionId,
      status: 'in_progress',
      startedAt: new Date(),
    })
    .returning();

  try {
    // Fetch transactions and balance from provider
    const providerData = await fetchTransactionsFromProvider(connection);
    console.log(`📥 Fetched ${providerData.transactions.length} transactions from ${connection.provider}`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Check if this is the first sync (no imported transactions exist)
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.accountId, connection.accountId),
        sql`${transactions.importId} LIKE ${`simplefin:${connection.externalAccountId}:%`}`
      ))
      .limit(1);

    const isFirstSync = existingTransactions.length === 0;

    // On first sync, create a starting balance transaction
    if (isFirstSync && connection.provider === 'simplefin' && providerData.balance !== undefined) {
      const balanceInCents = providerData.balance; // Already converted to cents!

      console.log(`Creating starting balance transaction: ${balanceInCents} cents`);

      await createStartingBalanceTransaction(
        connection.accountId,
        connection.externalAccountId,
        balanceInCents,
        connection.syncStartDate || new Date()
      );

      // Set account balances to match starting balance
      await db.update(accounts).set({
        balance: balanceInCents,
        clearedBalance: balanceInCents,
        unclearedBalance: 0,
        updatedAt: new Date(),
      }).where(eq(accounts.id, connection.accountId));

      imported++;
    } else if (isFirstSync && connection.provider === 'simplefin') {
      console.error('⚠️ Starting balance not available from SimpleFin');
    }

    for (const txn of providerData.transactions) {
      try {
        const importId = generateImportId(connection.provider, connection.externalAccountId, txn.externalId);

        // Check if transaction already exists
        const [existing] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.importId, importId), isNull(transactions.deletedAt)));

        if (existing) {
          // Update if amount or status changed
          if (existing.amount !== txn.amount || existing.status !== txn.status) {
            const oldAmount = existing.amount;
            const oldStatus = existing.status;

            await db
              .update(transactions)
              .set({
                amount: txn.amount,
                status: txn.status,
                payee: txn.payee, // Update payee in case it changed
                memo: txn.memo,
                updatedAt: new Date(),
              })
              .where(eq(transactions.id, existing.id));

            // Reverse old balance impact and apply new balance
            const balanceDelta = txn.amount - oldAmount;

            if (balanceDelta !== 0 || oldStatus !== txn.status) {
              // Update account balance
              await db
                .update(accounts)
                .set({
                  balance: sql`${accounts.balance} + ${balanceDelta}`,
                  clearedBalance:
                    txn.status === 'cleared'
                      ? sql`${accounts.clearedBalance} + ${balanceDelta}`
                      : oldStatus === 'cleared'
                        ? sql`${accounts.clearedBalance} - ${oldAmount}`
                        : accounts.clearedBalance,
                  unclearedBalance:
                    txn.status === 'uncleared'
                      ? sql`${accounts.unclearedBalance} + ${balanceDelta}`
                      : oldStatus === 'uncleared'
                        ? sql`${accounts.unclearedBalance} - ${oldAmount}`
                        : accounts.unclearedBalance,
                  updatedAt: new Date(),
                })
                .where(eq(accounts.id, connection.accountId));

              // Update budget activity if categorized
              if (existing.categoryId) {
                await updateBudgetActivityForTransaction(existing.categoryId, existing.date);
              }
            }

            updated++;
          } else {
            skipped++;
          }
        } else {
          // Insert new transaction
          console.log(`➕ Inserting new transaction:`, {
            accountId: connection.accountId,
            importId,
            date: txn.date,
            amount: txn.amount,
            payee: txn.payee,
            status: txn.status,
          });

          const [newTransaction] = await db
            .insert(transactions)
            .values({
              accountId: connection.accountId,
              importId,
              date: txn.date,
              amount: txn.amount,
              payee: txn.payee,
              memo: txn.memo,
              status: txn.status,
            })
            .returning();

          console.log(`✅ Transaction inserted with ID:`, newTransaction.id);
          imported++;

          // Update account balance
          if (txn.status === 'cleared') {
            await db
              .update(accounts)
              .set({
                balance: sql`${accounts.balance} + ${txn.amount}`,
                clearedBalance: sql`${accounts.clearedBalance} + ${txn.amount}`,
                updatedAt: new Date(),
              })
              .where(eq(accounts.id, connection.accountId));
          } else {
            await db
              .update(accounts)
              .set({
                balance: sql`${accounts.balance} + ${txn.amount}`,
                unclearedBalance: sql`${accounts.unclearedBalance} + ${txn.amount}`,
                updatedAt: new Date(),
              })
              .where(eq(accounts.id, connection.accountId));
          }

          // Update budget activity if categorized (will be null for imported transactions initially)
          if (newTransaction.categoryId) {
            await updateBudgetActivityForTransaction(newTransaction.categoryId, txn.date);
          }
        }
      } catch (error) {
        errors.push(
          `Transaction ${txn.externalId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update sync log
    await db
      .update(importSyncLogs)
      .set({
        status: errors.length === providerData.transactions.length ? 'failed' : errors.length > 0 ? 'partial' : 'success',
        completedAt: new Date(),
        transactionsImported: imported,
        transactionsUpdated: updated,
        transactionsSkipped: skipped,
        errorMessage: errors.length > 0 ? `${errors.length} errors occurred` : null,
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : null,
      })
      .where(eq(importSyncLogs.id, syncLog.id));

    // Update connection last sync
    await db
      .update(accountConnections)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: errors.length > 0 ? 'partial' : 'success',
        lastError: errors.length > 0 ? errors[0] : null,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(accountConnections.id, connectionId));

    return { imported, updated, skipped, errors };
  } catch (error) {
    // Log failure
    await db
      .update(importSyncLogs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(importSyncLogs.id, syncLog.id));

    await db
      .update(accountConnections)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        status: error instanceof Error && error.message.includes('authentication') ? 'expired' : 'error',
        updatedAt: new Date(),
      })
      .where(eq(accountConnections.id, connectionId));

    throw error;
  }
}
