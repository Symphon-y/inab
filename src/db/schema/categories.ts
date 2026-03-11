import { pgTable, uuid, varchar, boolean, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { plans } from './plans';

export const categoryGroups = pgTable('category_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isHidden: boolean('is_hidden').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryGroupId: uuid('category_group_id').notNull().references(() => categoryGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 10 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isHidden: boolean('is_hidden').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Relations
export const categoryGroupsRelations = relations(categoryGroups, ({ one, many }) => ({
  plan: one(plans, {
    fields: [categoryGroups.planId],
    references: [plans.id],
  }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  categoryGroup: one(categoryGroups, {
    fields: [categories.categoryGroupId],
    references: [categoryGroups.id],
  }),
}));

export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type NewCategoryGroup = typeof categoryGroups.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
