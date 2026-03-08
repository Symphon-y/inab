import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
  dateFormat: varchar('date_format', { length: 20 }).notNull().default('MM/DD/YYYY'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
