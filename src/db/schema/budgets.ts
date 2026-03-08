import { pgTable, uuid, bigint, date, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

export const budgetAllocations = pgTable(
  'budget_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    month: date('month', { mode: 'date' }).notNull(),
    assigned: bigint('assigned', { mode: 'number' }).notNull().default(0),
    activity: bigint('activity', { mode: 'number' }).notNull().default(0),
    available: bigint('available', { mode: 'number' }).notNull().default(0),
    carryover: bigint('carryover', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_category_month').on(table.categoryId, table.month),
  ]
);

export const budgetAllocationsRelations = relations(budgetAllocations, ({ one }) => ({
  category: one(categories, {
    fields: [budgetAllocations.categoryId],
    references: [categories.id],
  }),
}));

export type BudgetAllocation = typeof budgetAllocations.$inferSelect;
export type NewBudgetAllocation = typeof budgetAllocations.$inferInsert;
