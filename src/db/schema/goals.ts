import { pgTable, uuid, bigint, date, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

export const goalTypeEnum = pgEnum('goal_type', [
  'target_balance',
  'target_balance_by_date',
  'monthly_funding',
  'spending_monthly',
]);

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  goalType: goalTypeEnum('goal_type').notNull(),
  targetAmount: bigint('target_amount', { mode: 'number' }),
  targetDate: date('target_date', { mode: 'date' }),
  monthlyFunding: bigint('monthly_funding', { mode: 'number' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  category: one(categories, {
    fields: [goals.categoryId],
    references: [categories.id],
  }),
}));

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalType = (typeof goalTypeEnum.enumValues)[number];
