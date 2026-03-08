'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Category } from '@/db/schema';

interface CategoryRowProps {
  category: Category;
  assigned: number;
  activity: number;
  available: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAssign: (category: Category) => void;
}

export function CategoryRow({
  category,
  assigned,
  activity,
  available,
  onEdit,
  onDelete,
  onAssign,
}: CategoryRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'auto',
    }).format(cents / 100);
  };

  const getAvailableColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount === 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={cn(
        'grid grid-cols-4 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group',
        isHovered && 'bg-muted/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category Name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{category.name}</span>
        {category.note && (
          <span className="text-xs text-muted-foreground" title={category.note}>
            ⓘ
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity',
                isHovered && 'opacity-100'
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assigned */}
      <button
        onClick={() => onAssign(category)}
        className="text-right text-sm font-medium tabular-nums hover:text-primary transition-colors"
      >
        {formatCurrency(assigned)}
      </button>

      {/* Activity */}
      <div className={cn('text-right text-sm font-medium tabular-nums', activity !== 0 && 'text-muted-foreground')}>
        {formatCurrency(activity)}
      </div>

      {/* Available */}
      <div className={cn('text-right text-sm font-semibold tabular-nums', getAvailableColor(available))}>
        {formatCurrency(available)}
      </div>
    </div>
  );
}
