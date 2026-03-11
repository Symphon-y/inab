import { pgTable, uuid, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { accountConnections } from './account-connections';

export const importSyncLogs = pgTable('import_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').notNull().references(() => accountConnections.id, { onDelete: 'cascade' }),

  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  status: varchar('status', { length: 50 }).notNull(), // 'in_progress', 'success', 'partial', 'failed'

  transactionsImported: integer('transactions_imported').notNull().default(0),
  transactionsUpdated: integer('transactions_updated').notNull().default(0),
  transactionsSkipped: integer('transactions_skipped').notNull().default(0),

  errorMessage: text('error_message'),
  errorDetails: text('error_details'), // JSON string with detailed error info

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const importSyncLogsRelations = relations(importSyncLogs, ({ one }) => ({
  connection: one(accountConnections, {
    fields: [importSyncLogs.connectionId],
    references: [accountConnections.id],
  }),
}));

export type ImportSyncLog = typeof importSyncLogs.$inferSelect;
export type NewImportSyncLog = typeof importSyncLogs.$inferInsert;
