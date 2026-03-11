import { pgTable, uuid, varchar, bigint, boolean, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { plans } from './plans';

export const accountTypeEnum = pgEnum('account_type', [
  'checking',
  'savings',
  'credit_card',
  'cash',
  'line_of_credit',
  'investment',
  'other',
]);

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  accountType: accountTypeEnum('account_type').notNull(),
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  clearedBalance: bigint('cleared_balance', { mode: 'number' }).notNull().default(0),
  unclearedBalance: bigint('uncleared_balance', { mode: 'number' }).notNull().default(0),
  isOnBudget: boolean('is_on_budget').notNull().default(true),
  isClosed: boolean('is_closed').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  note: text('note'),
  lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true }),
  lastReconciledBalance: bigint('last_reconciled_balance', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  plan: one(plans, {
    fields: [accounts.planId],
    references: [plans.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
