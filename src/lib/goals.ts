import type { Goal, GoalType } from '@/db/schema';

/**
 * Goal status indicator
 */
export type GoalStatus = 'on-track' | 'warning' | 'behind' | 'complete';

/**
 * Calculate the progress percentage for a goal
 * @param goal - The goal object
 * @param currentBalance - The category's current available balance in cents
 * @returns Progress percentage (0-100)
 */
export function calculateGoalProgress(goal: Goal, currentBalance: number): number {
  const { goalType, targetAmount, monthlyFunding } = goal;

  switch (goalType) {
    case 'target_balance':
    case 'target_balance_by_date':
      if (!targetAmount || targetAmount === 0) return 0;
      return Math.min((currentBalance / targetAmount) * 100, 100);

    case 'monthly_funding':
      // For monthly funding, we show progress toward this month's goal
      if (!monthlyFunding || monthlyFunding === 0) return 0;
      return Math.min((currentBalance / monthlyFunding) * 100, 100);

    case 'spending_monthly':
      // For spending limits, we show how much of the budget is left (inverse)
      if (!monthlyFunding || monthlyFunding === 0) return 0;
      const remaining = Math.max(currentBalance, 0);
      return Math.min((remaining / monthlyFunding) * 100, 100);

    default:
      return 0;
  }
}

/**
 * Calculate how much is needed this month to stay on track
 * @param goal - The goal object
 * @param currentBalance - The category's current available balance in cents
 * @returns Amount needed in cents (can be negative if ahead)
 */
export function calculateMonthlyNeeded(goal: Goal, currentBalance: number): number {
  const { goalType, targetAmount, targetDate, monthlyFunding } = goal;

  switch (goalType) {
    case 'target_balance':
      // For simple target balance, no specific monthly need
      if (!targetAmount) return 0;
      return targetAmount - currentBalance;

    case 'target_balance_by_date':
      // Calculate based on months remaining
      if (!targetAmount || !targetDate) return 0;

      const now = new Date();
      const target = new Date(targetDate);
      const monthsRemaining = Math.max(
        (target.getFullYear() - now.getFullYear()) * 12 +
          (target.getMonth() - now.getMonth()) +
          1,
        1
      );

      const totalNeeded = targetAmount - currentBalance;
      return Math.ceil(totalNeeded / monthsRemaining);

    case 'monthly_funding':
      // Simply the monthly funding amount minus current balance
      if (!monthlyFunding) return 0;
      return monthlyFunding - currentBalance;

    case 'spending_monthly':
      // For spending, show remaining budget
      if (!monthlyFunding) return 0;
      return currentBalance; // This is how much is left to spend

    default:
      return 0;
  }
}

/**
 * Check if a goal is complete
 * @param goal - The goal object
 * @param currentBalance - The category's current available balance in cents
 * @returns True if goal is achieved
 */
export function isGoalComplete(goal: Goal, currentBalance: number): boolean {
  const { goalType, targetAmount, monthlyFunding } = goal;

  switch (goalType) {
    case 'target_balance':
    case 'target_balance_by_date':
      return !!targetAmount && currentBalance >= targetAmount;

    case 'monthly_funding':
      return !!monthlyFunding && currentBalance >= monthlyFunding;

    case 'spending_monthly':
      // For spending, goal is "complete" if within budget
      return !!monthlyFunding && currentBalance >= 0;

    default:
      return false;
  }
}

/**
 * Get the status color for a goal
 * @param goal - The goal object
 * @param currentBalance - The category's current available balance in cents
 * @returns Status indicator
 */
export function getGoalStatus(goal: Goal, currentBalance: number): GoalStatus {
  if (isGoalComplete(goal, currentBalance)) {
    return 'complete';
  }

  const progress = calculateGoalProgress(goal, currentBalance);

  // For target_balance_by_date, consider time remaining
  if (goal.goalType === 'target_balance_by_date' && goal.targetDate) {
    const now = new Date();
    const target = new Date(goal.targetDate);
    const totalMonths = Math.max(
      (target.getFullYear() - now.getFullYear()) * 12 +
        (target.getMonth() - now.getMonth()),
      0
    );

    // If less than 2 months remaining and not at 80% progress
    if (totalMonths < 2 && progress < 80) {
      return 'behind';
    }
    // If progress is lower than expected based on time
    if (totalMonths > 0) {
      const timeElapsed = 1 - totalMonths / 12; // Rough estimate
      if (progress < timeElapsed * 100 - 20) {
        return 'behind';
      }
    }
  }

  // General progress-based status
  if (progress >= 75) return 'on-track';
  if (progress >= 40) return 'warning';
  return 'behind';
}

/**
 * Get suggested contribution text for a goal
 * @param goal - The goal object
 * @param currentBalance - The category's current available balance in cents
 * @returns Human-readable suggestion text
 */
export function getSuggestedContribution(goal: Goal, currentBalance: number): string {
  const { goalType, targetAmount, targetDate, monthlyFunding } = goal;
  const monthlyNeeded = calculateMonthlyNeeded(goal, currentBalance);

  if (isGoalComplete(goal, currentBalance)) {
    switch (goalType) {
      case 'spending_monthly':
        return `${formatCurrency(currentBalance)} remaining this month`;
      default:
        return 'Goal achieved! 🎉';
    }
  }

  switch (goalType) {
    case 'target_balance':
      if (monthlyNeeded > 0) {
        return `${formatCurrency(monthlyNeeded)} more to reach goal`;
      }
      return 'Target reached!';

    case 'target_balance_by_date':
      if (!targetDate) return '';
      if (monthlyNeeded > 0) {
        return `Need ${formatCurrency(monthlyNeeded)}/month`;
      }
      return 'On track!';

    case 'monthly_funding':
      if (monthlyNeeded > 0) {
        return `Need ${formatCurrency(monthlyNeeded)} more this month`;
      }
      return 'Monthly goal met!';

    case 'spending_monthly':
      if (!monthlyFunding) return '';
      const spent = monthlyFunding - currentBalance;
      if (currentBalance > 0) {
        return `${formatCurrency(currentBalance)} left to spend`;
      }
      if (currentBalance === 0) {
        return 'Budget limit reached';
      }
      return `Over budget by ${formatCurrency(Math.abs(currentBalance))}`;

    default:
      return '';
  }
}

/**
 * Format currency for display
 * @param cents - Amount in cents
 * @returns Formatted currency string
 */
export function formatCurrency(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);

  return cents < 0 ? `-${formatted}` : formatted;
}

/**
 * Get goal type display label
 * @param goalType - The goal type enum value
 * @returns Human-readable label
 */
export function getGoalTypeLabel(goalType: GoalType): string {
  const labels: Record<GoalType, string> = {
    target_balance: 'Target Balance',
    target_balance_by_date: 'Target Balance by Date',
    monthly_funding: 'Monthly Funding',
    spending_monthly: 'Spending Limit',
  };
  return labels[goalType];
}

/**
 * Get color classes for goal status
 * @param status - The goal status
 * @returns Tailwind color classes
 */
export function getGoalStatusColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    complete: 'text-green-600 bg-green-50',
    'on-track': 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    behind: 'text-red-600 bg-red-50',
  };
  return colors[status];
}

/**
 * Get ordinal suffix for a day number
 * @param day - Day of the month (1-31)
 * @returns Ordinal suffix (st, nd, rd, th)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Get inline target text for YNAB-style display
 * @param goal - The goal object
 * @param currentAvailable - The category's current available balance in cents
 * @returns Inline text description of goal progress
 */
export function getGoalInlineText(goal: Goal, currentAvailable: number): string {
  const needed = calculateMonthlyNeeded(goal, currentAvailable);

  switch (goal.goalType) {
    case 'target_balance_by_date':
      if (goal.targetDate) {
        const date = new Date(goal.targetDate);
        const day = date.getDate();
        const absNeeded = Math.abs(needed);

        if (needed > 0) {
          return `${formatCurrency(absNeeded)} more needed by ${day}${getOrdinalSuffix(day)}`;
        } else if (needed < 0) {
          return `${formatCurrency(absNeeded)} over target for ${day}${getOrdinalSuffix(day)}`;
        } else {
          return `Target reached for ${day}${getOrdinalSuffix(day)}`;
        }
      }
      return '';

    case 'monthly_funding':
      if (needed > 0) {
        return `${formatCurrency(needed)} more needed this month`;
      } else if (needed < 0) {
        return `${formatCurrency(Math.abs(needed))} over monthly goal`;
      }
      return 'Monthly goal met';

    case 'target_balance':
      if (needed > 0) {
        return `${formatCurrency(needed)} more to reach target`;
      }
      return 'Target reached';

    case 'spending_monthly':
      if (currentAvailable > 0) {
        return `${formatCurrency(currentAvailable)} left to spend`;
      } else if (currentAvailable === 0) {
        return 'Budget limit reached';
      }
      return `Over budget by ${formatCurrency(Math.abs(currentAvailable))}`;

    default:
      return '';
  }
}
