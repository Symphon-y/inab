'use client';

import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoalStatus, getGoalTypeLabel, type GoalStatus } from '@/lib/goals';
import type { Goal } from '@/db/schema';

interface GoalBadgeProps {
  goal: Goal;
  currentBalance: number;
  variant?: 'default' | 'compact' | 'icon-only';
  showType?: boolean;
  className?: string;
}

export function GoalBadge({
  goal,
  currentBalance,
  variant = 'default',
  showType = false,
  className,
}: GoalBadgeProps) {
  const status = getGoalStatus(goal, currentBalance);
  const goalTypeLabel = getGoalTypeLabel(goal.goalType);

  const getStatusIcon = (status: GoalStatus) => {
    const iconClass = 'h-3 w-3';
    switch (status) {
      case 'complete':
        return <CheckCircle className={iconClass} />;
      case 'on-track':
        return <TrendingUp className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'behind':
        return <AlertCircle className={iconClass} />;
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'complete':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'on-track':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'behind':
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getStatusLabel = (status: GoalStatus) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'on-track':
        return 'On Track';
      case 'warning':
        return 'Needs Attention';
      case 'behind':
        return 'Behind';
    }
  };

  if (variant === 'icon-only') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center',
          className
        )}
        title={`Goal: ${getStatusLabel(status)}`}
      >
        <Target className="h-3 w-3 text-muted-foreground" />
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border',
          getStatusColor(status),
          className
        )}
        title={showType ? goalTypeLabel : undefined}
      >
        {getStatusIcon(status)}
        {getStatusLabel(status)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
        getStatusColor(status),
        className
      )}
    >
      {getStatusIcon(status)}
      <span>{getStatusLabel(status)}</span>
      {showType && (
        <>
          <span className="text-[10px] opacity-60">•</span>
          <span className="text-[10px] opacity-75">{goalTypeLabel}</span>
        </>
      )}
    </span>
  );
}
