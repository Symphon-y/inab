'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getGoalInlineText } from '@/lib/goals';
import type { Category, Goal } from '@/db/schema';

interface CategoryRowProps {
  category: Category;
  assigned: number;
  activity: number;
  available: number;
  goal?: Goal | null;
  onClick?: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAssign: (category: Category) => void;
  onSetGoal: (category: Category) => void;
}

export function CategoryRow({
  category,
  assigned,
  activity,
  available,
  goal,
  onClick,
  onEdit,
  onDelete,
  onAssign,
  onSetGoal,
}: CategoryRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getAvailableBadgeStyle = (amount: number) => {
    if (amount > 0) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    }
    if (amount < 0) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    }
    // Yellow for zero (underfunded)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  };

  const handleRowClick = () => {
    if (onClick) {
      onClick(category);
    }
  };

  return (
    <div
      className={cn(
        'grid grid-cols-4 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group',
        isHovered && 'bg-muted/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Category Name with Icon and Inline Target Text */}
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0">{category.icon || '📁'}</span>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{category.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
                    isHovered && 'opacity-100'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetGoal(category)}>
                  <Target className="mr-2 h-4 w-4" />
                  {goal ? 'Edit Goal' : 'Set Goal'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Inline target text */}
          {goal && (
            <span className="text-xs text-muted-foreground">
              {getGoalInlineText(goal, available)}
            </span>
          )}
        </div>
      </div>

      {/* Assigned */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssign(category);
          }}
          className="text-right text-sm font-medium tabular-nums hover:text-primary transition-colors"
        >
          {formatCurrency(assigned)}
        </button>
      </div>

      {/* Activity */}
      <div className={cn('text-right text-sm font-medium tabular-nums', activity !== 0 && 'text-muted-foreground')}>
        {formatCurrency(activity)}
      </div>

      {/* Available with Badge */}
      <div className="flex items-center justify-end">
        {available !== 0 ? (
          <Badge className={cn('rounded-full font-semibold', getAvailableBadgeStyle(available))}>
            {formatCurrency(available)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">{formatCurrency(0)}</span>
        )}
      </div>
    </div>
  );
}
