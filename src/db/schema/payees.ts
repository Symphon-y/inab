import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { plans } from './plans';

export const payees = pgTable(
  'payees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    defaultCategoryId: uuid('default_category_id').references(() => categories.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_payee_name').on(table.planId, table.name),
  ]
);

export const payeesRelations = relations(payees, ({ one }) => ({
  plan: one(plans, {
    fields: [payees.planId],
    references: [plans.id],
  }),
  defaultCategory: one(categories, {
    fields: [payees.defaultCategoryId],
    references: [categories.id],
  }),
}));

export type Payee = typeof payees.$inferSelect;
export type NewPayee = typeof payees.$inferInsert;
