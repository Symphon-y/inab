import type { Goal } from '@/db/schema';
import { calculateMonthlyNeeded } from './goals';

/**
 * Budget history data structure
 */
export interface BudgetHistory {
  lastMonth: {
    assigned: number;
    activity: number;
    available: number;
  };
  averages: {
    averageAssigned: number;
    averageSpent: number;
  };
  currentMonth: {
    cashSpending: number;
    creditSpending: number;
  };
}

/**
 * Calculate the amount needed to fund a category to its target
 * @param goal - The category's goal/target
 * @param currentAvailable - Current available balance in cents
 * @returns Amount needed to reach target (0 if no goal or already funded)
 */
export function calculateUnderfunded(
  goal: Goal | null,
  currentAvailable: number
): number {
  if (!goal) return 0;

  const needed = calculateMonthlyNeeded(goal, currentAvailable);
  return Math.max(needed, 0);
}

/**
 * Get the amount assigned to this category last month
 * @param history - Budget history data
 * @returns Last month's assigned amount in cents
 */
export function calculateAssignedLastMonth(history: BudgetHistory | null): number {
  return history?.lastMonth?.assigned || 0;
}

/**
 * Get the amount spent in this category last month (absolute value)
 * @param history - Budget history data
 * @returns Last month's spending amount in cents (positive number)
 */
export function calculateSpentLastMonth(history: BudgetHistory | null): number {
  if (!history?.lastMonth?.activity) return 0;
  return Math.abs(Math.min(history.lastMonth.activity, 0));
}

/**
 * Get the average assigned amount over the last 3 months
 * @param history - Budget history data
 * @returns Average assigned amount in cents
 */
export function calculateAverageAssigned(history: BudgetHistory | null): number {
  return history?.averages?.averageAssigned || 0;
}

/**
 * Get the average spent amount over the last 3 months
 * @param history - Budget history data
 * @returns Average spent amount in cents (positive number)
 */
export function calculateAverageSpent(history: BudgetHistory | null): number {
  return history?.averages?.averageSpent || 0;
}

/**
 * Calculate the amount needed to reset available balance to zero
 * @param currentAvailable - Current available balance in cents
 * @returns Negative of current available (to zero it out)
 */
export function calculateResetAvailableAmount(currentAvailable: number): number {
  return -currentAvailable;
}

/**
 * Calculate the amount needed to reset assigned amount to zero
 * @param currentAssigned - Current assigned amount in cents
 * @returns Negative of current assigned (to zero it out)
 */
export function calculateResetAssignedAmount(currentAssigned: number): number {
  return -currentAssigned;
}
