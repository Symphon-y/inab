'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryRow } from './CategoryRow';
import { cn } from '@/lib/utils';
import type { CategoryGroup, Category, Goal } from '@/db/schema';

interface CategoryWithAllocations extends Category {
  assigned: number;
  activity: number;
  available: number;
}

interface CategoryGroupSectionProps {
  group: CategoryGroup;
  categories: CategoryWithAllocations[];
  onSelectCategory?: (category: Category) => void;
  onEditGroup: (group: CategoryGroup) => void;
  onDeleteGroup: (group: CategoryGroup) => void;
  onAddCategory: (groupId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAssignToCategory: (category: Category) => void;
  onSetGoal: (category: Category) => void;
  getGoalForCategory: (categoryId: string) => Goal | null;
}

export function CategoryGroupSection({
  group,
  categories,
  onSelectCategory,
  onEditGroup,
  onDeleteGroup,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAssignToCategory,
  onSetGoal,
  getGoalForCategory,
}: CategoryGroupSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Calculate group totals
  const totalAssigned = categories.reduce((sum, cat) => sum + cat.assigned, 0);
  const totalActivity = categories.reduce((sum, cat) => sum + cat.activity, 0);
  const totalAvailable = categories.reduce((sum, cat) => sum + cat.available, 0);

  return (
    <div className="border-b last:border-b-0">
      {/* Group Header */}
      <div className="grid grid-cols-4 gap-4 bg-muted/30 px-4 py-2 items-center group hover:bg-muted/50 transition-colors">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="col-span-2 flex items-center gap-2 min-w-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
            {group.name}
          </span>
        </button>

        <div className="col-span-2 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onAddCategory(group.id)}
            title="Add category"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditGroup(group)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteGroup(group)}
                className="text-destructive"
                disabled={categories.length > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Categories */}
      {!isCollapsed && (
        <div>
          {categories.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <p>No categories in this group yet.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => onAddCategory(group.id)}
                className="mt-2"
              >
                Add your first category
              </Button>
            </div>
          ) : (
            <>
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  assigned={category.assigned}
                  activity={category.activity}
                  available={category.available}
                  goal={getGoalForCategory(category.id)}
                  onClick={onSelectCategory}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                  onAssign={onAssignToCategory}
                  onSetGoal={onSetGoal}
                />
              ))}

              {/* Group Totals */}
              {categories.length > 1 && (
                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted/20 border-t text-sm font-semibold">
                  <div className="text-muted-foreground">Group Total</div>
                  <div className="text-right tabular-nums">{formatCurrency(totalAssigned)}</div>
                  <div className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(totalActivity)}
                  </div>
                  <div className="text-right tabular-nums">{formatCurrency(totalAvailable)}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
