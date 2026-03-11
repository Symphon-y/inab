'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  calculateGoalProgress,
  getGoalStatus,
  getGoalTypeLabel,
  formatCurrency,
  calculateMonthlyNeeded,
} from '@/lib/goals';
import type { Goal } from '@/db/schema';

interface GoalTooltipProps {
  goal: Goal;
  currentBalance: number;
  children: React.ReactNode;
}

export function GoalTooltip({ goal, currentBalance, children }: GoalTooltipProps) {
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
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs p-3" side="top">
        <div className="space-y-2">
          {/* Goal Type */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {goalTypeLabel}
            </span>
            <span className="text-xs font-medium">
              {Math.round(progress)}% Complete
            </span>
          </div>

          {/* Goal Details */}
          <div className="space-y-1 text-sm">
            {goal.targetAmount && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
              </div>
            )}

            {goal.targetDate && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">By:</span>
                <span className="font-medium">{formatDate(goal.targetDate)}</span>
              </div>
            )}

            {goal.monthlyFunding && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-medium">{formatCurrency(goal.monthlyFunding)}</span>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-1 border-t">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-semibold">{formatCurrency(currentBalance)}</span>
            </div>

            {monthlyNeeded > 0 && goal.goalType !== 'spending_monthly' && (
              <div className="flex justify-between gap-2 text-xs pt-1">
                <span className="text-muted-foreground">Need this month:</span>
                <span className="font-medium text-primary">
                  {formatCurrency(monthlyNeeded)}
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="pt-1 border-t">
            <span
              className={`text-xs font-medium ${
                status === 'complete' || status === 'on-track'
                  ? 'text-green-600'
                  : status === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {status === 'complete' && '✓ Goal achieved!'}
              {status === 'on-track' && '↗ On track'}
              {status === 'warning' && '⚠ Needs attention'}
              {status === 'behind' && '! Behind schedule'}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
