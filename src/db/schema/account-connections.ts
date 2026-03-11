import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';

export const connectionProviderEnum = pgEnum('connection_provider', [
  'simplefin',
  'manual', // For CSV/OFX uploads
]);

export const connectionStatusEnum = pgEnum('connection_status', [
  'active',
  'error',
  'disconnected',
  'expired',
]);

export const accountConnections = pgTable('account_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  provider: connectionProviderEnum('provider').notNull(),

  // Encrypted credentials (SimpleFin access URL)
  encryptedCredentials: text('encrypted_credentials').notNull(),

  // Provider-specific account identifier
  externalAccountId: varchar('external_account_id', { length: 255 }).notNull(),

  // Connection metadata
  status: connectionStatusEnum('status').notNull().default('active'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastSyncStatus: varchar('last_sync_status', { length: 50 }), // 'success', 'partial', 'failed'
  lastError: text('last_error'),

  // Sync configuration
  syncStartDate: timestamp('sync_start_date', { withTimezone: true }), // Only import transactions after this date

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const accountConnectionsRelations = relations(accountConnections, ({ one }) => ({
  account: one(accounts, {
    fields: [accountConnections.accountId],
    references: [accounts.id],
  }),
}));

export type AccountConnection = typeof accountConnections.$inferSelect;
export type NewAccountConnection = typeof accountConnections.$inferInsert;
export type ConnectionProvider = (typeof connectionProviderEnum.enumValues)[number];
export type ConnectionStatus = (typeof connectionStatusEnum.enumValues)[number];
