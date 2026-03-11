'use client';

import { cn } from '@/lib/utils';
import {
  calculateGoalProgress,
  getGoalStatus,
  getSuggestedContribution,
  getGoalStatusColor,
  type GoalStatus,
} from '@/lib/goals';
import type { Goal } from '@/db/schema';

interface GoalProgressBarProps {
  goal: Goal;
  currentBalance: number;
  compact?: boolean;
  showPercentage?: boolean;
  showSuggestion?: boolean;
  animated?: boolean;
  className?: string;
}

export function GoalProgressBar({
  goal,
  currentBalance,
  compact = false,
  showPercentage = true,
  showSuggestion = true,
  animated = true,
  className,
}: GoalProgressBarProps) {
  const progress = calculateGoalProgress(goal, currentBalance);
  const status = getGoalStatus(goal, currentBalance);
  const suggestion = getSuggestedContribution(goal, currentBalance);

  const getProgressBarColor = (status: GoalStatus) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'on-track':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'behind':
        return 'bg-red-500';
    }
  };

  const getProgressBarGlow = (status: GoalStatus) => {
    if (!animated) return '';

    switch (status) {
      case 'complete':
        return 'shadow-[0_0_8px_rgba(34,197,94,0.4)]';
      case 'on-track':
        return 'shadow-[0_0_6px_rgba(34,197,94,0.3)]';
      case 'warning':
        return 'shadow-[0_0_6px_rgba(234,179,8,0.3)]';
      case 'behind':
        return 'shadow-[0_0_6px_rgba(239,68,68,0.3)]';
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex-1 bg-muted rounded-full overflow-hidden',
          compact ? 'h-1' : 'h-1.5'
        )}>
          <div
            className={cn(
              'h-full transition-all',
              animated ? 'duration-500 ease-out' : 'duration-200',
              getProgressBarColor(status),
              getProgressBarGlow(status)
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {showPercentage && (
          <span className={cn(
            'text-muted-foreground tabular-nums font-medium',
            compact ? 'text-[10px] min-w-[2.5ch]' : 'text-xs min-w-[3ch]'
          )}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Suggestion Text */}
      {showSuggestion && suggestion && !compact && (
        <div className="flex items-start">
          <p className={cn(
            'text-xs px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-medium',
            getGoalStatusColor(status),
            animated && 'transition-colors duration-200'
          )}>
            {status === 'complete' && '✓ '}
            {status === 'behind' && '! '}
            {suggestion}
          </p>
        </div>
      )}
    </div>
  );
}
