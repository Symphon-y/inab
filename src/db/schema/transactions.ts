import { pgTable, uuid, varchar, bigint, date, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';
import { categories } from './categories';

export const transactionStatusEnum = pgEnum('transaction_status', ['cleared', 'uncleared', 'reconciled']);

export const transactionFlagEnum = pgEnum('transaction_flag', [
  'none',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id),
  transferAccountId: uuid('transfer_account_id').references(() => accounts.id),
  transferTransactionId: uuid('transfer_transaction_id'),
  payee: varchar('payee', { length: 255 }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  date: date('date', { mode: 'date' }).notNull(),
  memo: text('memo'),
  status: transactionStatusEnum('status').notNull().default('uncleared'),
  flag: transactionFlagEnum('flag').notNull().default('none'),
  isSplit: boolean('is_split').notNull().default(false),
  parentTransactionId: uuid('parent_transaction_id'),
  importId: varchar('import_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Self-reference for parent transaction (split transactions)
export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  transferAccount: one(accounts, {
    fields: [transactions.transferAccountId],
    references: [accounts.id],
    relationName: 'transferAccount',
  }),
  parentTransaction: one(transactions, {
    fields: [transactions.parentTransactionId],
    references: [transactions.id],
    relationName: 'splitChildren',
  }),
  splitChildren: many(transactions, {
    relationName: 'splitChildren',
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionStatus = (typeof transactionStatusEnum.enumValues)[number];
export type TransactionFlag = (typeof transactionFlagEnum.enumValues)[number];
