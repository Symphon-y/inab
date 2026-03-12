'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface ReadyToAssignCardProps {
  year: number;
  month: number;
  refreshTrigger?: number;
}

interface BudgetSummary {
  readyToAssign: number;
  totalIncome: number;
  totalAssigned: number;
  totalActivity: number;
}

export function ReadyToAssignCard({ year, month, refreshTrigger }: ReadyToAssignCardProps) {
  const [summary, setSummary] = useState<BudgetSummary>({
    readyToAssign: 0,
    totalIncome: 0,
    totalAssigned: 0,
    totalActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/budget/summary?year=${year}&month=${month}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch budget summary:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  const getReadyToAssignColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount === 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ready to Assign</p>
            <p className="text-2xl font-semibold text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ready to Assign</p>
          <p className={cn('text-2xl font-semibold', getReadyToAssignColor(summary.readyToAssign))}>
            {formatCurrency(summary.readyToAssign)}
          </p>
          {summary.readyToAssign < 0 && (
            <p className="mt-1 text-xs text-red-600">
              You have assigned more than your available income
            </p>
          )}
          {summary.readyToAssign > 0 && (
            <p className="mt-1 text-xs text-green-600">
              Assign {formatCurrency(summary.readyToAssign)} to your categories
            </p>
          )}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Total Income: {formatCurrency(summary.totalIncome)}</p>
          <p>Total Assigned: {formatCurrency(summary.totalAssigned)}</p>
        </div>
      </div>
    </div>
  );
}
