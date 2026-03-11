'use client';

import { Target, Calendar, TrendingUp, DollarSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { GoalProgressBar } from './GoalProgressBar';
import {
  calculateGoalProgress,
  getGoalStatus,
  getGoalTypeLabel,
  formatCurrency,
  calculateMonthlyNeeded,
} from '@/lib/goals';
import type { Goal, Category } from '@/db/schema';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  category: Category;
  currentBalance: number;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  category,
  currentBalance,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const progress = calculateGoalProgress(goal, currentBalance);
  const status = getGoalStatus(goal, currentBalance);
  const goalTypeLabel = getGoalTypeLabel(goal.goalType);
  const monthlyNeeded = calculateMonthlyNeeded(goal, currentBalance);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'p-2 rounded-lg',
              status === 'complete' && 'bg-green-100 text-green-700',
              status === 'on-track' && 'bg-green-50 text-green-600',
              status === 'warning' && 'bg-yellow-50 text-yellow-600',
              status === 'behind' && 'bg-red-50 text-red-600'
            )}>
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{goalTypeLabel}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        <GoalProgressBar
          goal={goal}
          currentBalance={currentBalance}
          compact={false}
          showPercentage={true}
          showSuggestion={true}
          animated={true}
        />

        {/* Goal Details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {/* Current Balance */}
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-sm font-semibold">{formatCurrency(currentBalance)}</p>
            </div>
          </div>

          {/* Target Amount */}
          {(goal.goalType === 'target_balance' || goal.goalType === 'target_balance_by_date') && goal.targetAmount && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-sm font-semibold">{formatCurrency(goal.targetAmount)}</p>
              </div>
            </div>
          )}

          {/* Monthly Funding */}
          {(goal.goalType === 'monthly_funding' || goal.goalType === 'spending_monthly') && goal.monthlyFunding && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="text-sm font-semibold">{formatCurrency(goal.monthlyFunding)}</p>
              </div>
            </div>
          )}

          {/* Target Date */}
          {goal.goalType === 'target_balance_by_date' && goal.targetDate && (
            <div className="flex items-start gap-2 col-span-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Target Date</p>
                <p className="text-sm font-semibold">{formatDate(goal.targetDate)}</p>
              </div>
            </div>
          )}

          {/* Monthly Needed */}
          {monthlyNeeded > 0 && goal.goalType !== 'spending_monthly' && (
            <div className="flex items-start gap-2 col-span-2 pt-2 border-t">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">To reach your goal</p>
                <p className="text-sm font-semibold text-primary">
                  {goal.goalType === 'target_balance_by_date'
                    ? `Save ${formatCurrency(monthlyNeeded)}/month`
                    : `Save ${formatCurrency(monthlyNeeded)} more`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
