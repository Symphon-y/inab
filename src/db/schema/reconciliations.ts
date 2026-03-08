import { pgTable, uuid, bigint, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';

export const reconciliations = pgTable('reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  statementBalance: bigint('statement_balance', { mode: 'number' }).notNull(),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }).notNull().defaultNow(),
  note: text('note'),
});

export const reconciliationsRelations = relations(reconciliations, ({ one }) => ({
  account: one(accounts, {
    fields: [reconciliations.accountId],
    references: [accounts.id],
  }),
}));

export type Reconciliation = typeof reconciliations.$inferSelect;
export type NewReconciliation = typeof reconciliations.$inferInsert;
