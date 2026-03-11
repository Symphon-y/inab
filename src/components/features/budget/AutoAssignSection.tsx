'use client';

import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from './CollapsibleSection';
import { formatCurrency } from '@/lib/goals';
import {
  calculateUnderfunded,
  calculateAssignedLastMonth,
  calculateSpentLastMonth,
  calculateAverageAssigned,
  calculateAverageSpent,
  calculateResetAvailableAmount,
  calculateResetAssignedAmount,
  type BudgetHistory,
} from '@/lib/auto-assign';
import type { Goal } from '@/db/schema';

interface BudgetAllocation {
  assigned: number;
  activity: number;
  available: number;
  carryover: number;
}

interface AutoAssignSectionProps {
  goal: Goal | null;
  allocation: BudgetAllocation;
  history: BudgetHistory | null;
  onAutoAssign: (amount: number, label: string) => void;
}

interface AutoAssignButtonProps {
  label: string;
  amount: number;
  onClick: () => void;
}

function AutoAssignButton({ label, amount, onClick }: AutoAssignButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="w-full justify-between h-auto py-2 px-3 text-sm font-normal hover:bg-muted"
    >
      <span className="text-foreground">{label}</span>
      <span
        className={amount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}
      >
        {formatCurrency(amount)}
      </span>
    </Button>
  );
}

export function AutoAssignSection({
  goal,
  allocation,
  history,
  onAutoAssign,
}: AutoAssignSectionProps) {
  const underfunded = calculateUnderfunded(goal, allocation.available);
  const assignedLastMonth = calculateAssignedLastMonth(history);
  const spentLastMonth = calculateSpentLastMonth(history);
  const averageAssigned = calculateAverageAssigned(history);
  const averageSpent = calculateAverageSpent(history);
  const resetAvailable = calculateResetAvailableAmount(allocation.available);
  const resetAssigned = calculateResetAssignedAmount(allocation.assigned);

  return (
    <CollapsibleSection
      title="Auto-Assign"
      icon={<Zap className="h-4 w-4" />}
      defaultCollapsed={false}
    >
      <div className="space-y-1">
        <AutoAssignButton
          label="Underfunded"
          amount={underfunded}
          onClick={() => onAutoAssign(underfunded, 'Underfunded')}
        />
        <AutoAssignButton
          label="Assigned Last Month"
          amount={assignedLastMonth}
          onClick={() => onAutoAssign(assignedLastMonth, 'Assigned Last Month')}
        />
        <AutoAssignButton
          label="Spent Last Month"
          amount={spentLastMonth}
          onClick={() => onAutoAssign(spentLastMonth, 'Spent Last Month')}
        />
        <AutoAssignButton
          label="Average Assigned"
          amount={averageAssigned}
          onClick={() => onAutoAssign(averageAssigned, 'Average Assigned')}
        />
        <AutoAssignButton
          label="Average Spent"
          amount={averageSpent}
          onClick={() => onAutoAssign(averageSpent, 'Average Spent')}
        />
        <AutoAssignButton
          label="Reset Available Amount"
          amount={resetAvailable}
          onClick={() => onAutoAssign(resetAvailable, 'Reset Available Amount')}
        />
        <AutoAssignButton
          label="Reset Assigned Amount"
          amount={resetAssigned}
          onClick={() => onAutoAssign(resetAssigned, 'Reset Assigned Amount')}
        />
      </div>
    </CollapsibleSection>
  );
}
