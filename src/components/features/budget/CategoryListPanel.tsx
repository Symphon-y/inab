'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryGroupSection } from './CategoryGroupSection';
import { CategoryGridHeader } from './CategoryGridHeader';
import type { CategoryGroup, Category, Goal } from '@/db/schema';

interface CategoryGroupWithCategories extends CategoryGroup {
  categories: Category[];
}

interface CategoryListPanelProps {
  categoryGroups: CategoryGroupWithCategories[];
  goals: Goal[];
  budgetAllocations: Record<string, {
    assigned: number;
    activity: number;
    available: number;
  }>;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddGroup: () => void;
  onEditGroup: (group: CategoryGroup) => void;
  onDeleteGroup: (group: CategoryGroup) => void;
  onAddCategory: (groupId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onSetGoal?: (category: Category) => void;
  onAssignToCategory?: (category: Category) => void;
}

export function CategoryListPanel({
  categoryGroups,
  goals,
  budgetAllocations,
  selectedCategoryId,
  onSelectCategory,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSetGoal,
  onAssignToCategory,
}: CategoryListPanelProps) {
  const handleSelectCategory = (category: Category) => {
    onSelectCategory(category.id);
  };

  const getGoalForCategory = (categoryId: string): Goal | null => {
    return goals.find((g) => g.categoryId === categoryId) || null;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b px-4 flex items-center justify-between gap-2 flex-shrink-0">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
          Categories
        </h2>
        <Button type="button" onClick={onAddGroup} size="sm" variant="ghost" className="h-7">
          <Plus className="h-3 w-3 mr-1" />
          Group
        </Button>
      </div>

      {/* Column Headers */}
      <CategoryGridHeader />

      {/* Scrollable Category Groups */}
      <ScrollArea className="flex-1">
        {categoryGroups.map((group) => {
          const categoriesWithAllocations = group.categories.map((cat) => ({
            ...cat,
            assigned: budgetAllocations[cat.id]?.assigned || 0,
            activity: budgetAllocations[cat.id]?.activity || 0,
            available: budgetAllocations[cat.id]?.available || 0,
          }));

          return (
            <CategoryGroupSection
              key={group.id}
              group={group}
              categories={categoriesWithAllocations}
              onSelectCategory={handleSelectCategory}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onAssignToCategory={onAssignToCategory || (() => {})}
              onSetGoal={onSetGoal || (() => {})}
              getGoalForCategory={getGoalForCategory}
            />
          );
        })}
      </ScrollArea>
    </div>
  );
}
