'use client';

import { cn } from '@/lib/utils';
import { calculateGoalProgress, getGoalStatus } from '@/lib/goals';
import type { Category, Goal } from '@/db/schema';

interface CategoryListItemProps {
  category: Category;
  goal: Goal | null;
  currentBalance: number;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: (categoryId: string) => void;
}

export function CategoryListItem({
  category,
  goal,
  currentBalance,
  isSelected,
  isCollapsed,
  onSelect,
}: CategoryListItemProps) {
  const hasGoal = goal !== null;
  const progress = hasGoal ? calculateGoalProgress(goal, currentBalance) : 0;
  const status = hasGoal ? getGoalStatus(goal, currentBalance) : null;

  return (
    <button
      onClick={() => onSelect(category.id)}
      className={cn(
        'w-full flex flex-col gap-1 px-4 py-2 hover:bg-muted/50 transition-colors group',
        isSelected && 'bg-primary/10 border-l-2 border-primary',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? category.name : undefined}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Category emoji/icon */}
        <span className="text-lg flex-shrink-0">
          {category.icon || '📁'}
        </span>

        {/* Category name (hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate text-sm">
              {category.name}
            </span>

            {/* Target status */}
            <span className="text-xs text-muted-foreground">
              {hasGoal ? (
                status === 'complete' ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  `${Math.round(progress)}%`
                )
              ) : (
                'No target'
              )}
            </span>
          </>
        )}
      </div>

      {/* Progress bar - shown only when not collapsed and has goal */}
      {!isCollapsed && hasGoal && (
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden ml-9">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              status === 'complete' && 'bg-green-500',
              status === 'on-track' && 'bg-green-400',
              status === 'warning' && 'bg-yellow-400',
              status === 'behind' && 'bg-red-400'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </button>
  );
}
