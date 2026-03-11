'use client';

import { CollapsibleSection } from './CollapsibleSection';
import { DetailRow } from './DetailRow';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/goals';
import type { BudgetHistory } from '@/lib/auto-assign';

interface BudgetAllocation {
  assigned: number;
  activity: number;
  available: number;
  carryover: number;
}

interface AvailableBalanceSectionProps {
  allocation: BudgetAllocation;
  history: BudgetHistory | null;
}

export function AvailableBalanceSection({
  allocation,
  history,
}: AvailableBalanceSectionProps) {
  const cashSpending = history?.currentMonth?.cashSpending || 0;
  const creditSpending = history?.currentMonth?.creditSpending || 0;

  return (
    <CollapsibleSection
      title="Available Balance"
      badge={
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300">
          {formatCurrency(allocation.available)}
        </Badge>
      }
      defaultCollapsed={false}
    >
      <DetailRow
        label="Cash Left Over From Last Month"
        value={formatCurrency(allocation.carryover)}
      />
      <DetailRow
        label="Assigned This Month"
        value={formatCurrency(allocation.assigned)}
      />
      <DetailRow
        label="Cash Spending"
        value={formatCurrency(cashSpending)}
        variant={cashSpending < 0 ? 'default' : 'default'}
      />
      <DetailRow
        label="Credit Spending"
        value={formatCurrency(creditSpending)}
        variant={creditSpending < 0 ? 'default' : 'default'}
      />
    </CollapsibleSection>
  );
}
