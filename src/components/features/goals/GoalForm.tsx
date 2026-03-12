'use client';

import { useState, useEffect } from 'react';
import { dollarsToCents } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Goal, GoalType, Category } from '@/db/schema';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  categoryId?: string;
  categories?: Category[];
  onSubmit: (data: GoalFormData) => Promise<void>;
}

export interface GoalFormData {
  categoryId: string;
  goalType: GoalType;
  targetAmount?: number;
  targetDate?: Date;
  monthlyFunding?: number;
}

const GOAL_TYPES = [
  {
    value: 'target_balance' as GoalType,
    label: 'Target Balance',
    description: 'Save a specific amount total',
  },
  {
    value: 'target_balance_by_date' as GoalType,
    label: 'Target Balance by Date',
    description: 'Save a specific amount by a target date',
  },
  {
    value: 'monthly_funding' as GoalType,
    label: 'Monthly Funding',
    description: 'Save a specific amount each month',
  },
  {
    value: 'spending_monthly' as GoalType,
    label: 'Spending Limit',
    description: 'Spend no more than a specific amount per month',
  },
];

export function GoalForm({
  open,
  onOpenChange,
  goal,
  categoryId: initialCategoryId,
  categories = [],
  onSubmit,
}: GoalFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [goalType, setGoalType] = useState<GoalType>('target_balance');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyFunding, setMonthlyFunding] = useState('');

  const isEditing = !!goal;

  useEffect(() => {
    if (goal) {
      setCategoryId(goal.categoryId);
      setGoalType(goal.goalType);
      setTargetAmount(goal.targetAmount ? (goal.targetAmount / 100).toFixed(2) : '');
      setTargetDate(goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : '');
      setMonthlyFunding(goal.monthlyFunding ? (goal.monthlyFunding / 100).toFixed(2) : '');
    } else {
      setCategoryId(initialCategoryId || '');
      setGoalType('target_balance');
      setTargetAmount('');
      setTargetDate('');
      setMonthlyFunding('');
    }
  }, [goal, initialCategoryId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: GoalFormData = {
        categoryId,
        goalType,
      };

      // Add fields based on goal type
      if (goalType === 'target_balance' || goalType === 'target_balance_by_date') {
        data.targetAmount = dollarsToCents(targetAmount);
      }

      if (goalType === 'target_balance_by_date') {
        data.targetDate = new Date(targetDate);
      }

      if (goalType === 'monthly_funding' || goalType === 'spending_monthly') {
        data.monthlyFunding = dollarsToCents(monthlyFunding);
      }

      await onSubmit(data);
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategoryId(initialCategoryId || '');
    setGoalType('target_balance');
    setTargetAmount('');
    setTargetDate('');
    setMonthlyFunding('');
  };

  const selectedGoalType = GOAL_TYPES.find((t) => t.value === goalType);

  const isFormValid = () => {
    if (!categoryId) return false;

    switch (goalType) {
      case 'target_balance':
        return !!targetAmount && parseFloat(targetAmount) > 0;
      case 'target_balance_by_date':
        return !!targetAmount && parseFloat(targetAmount) > 0 && !!targetDate;
      case 'monthly_funding':
      case 'spending_monthly':
        return !!monthlyFunding && parseFloat(monthlyFunding) > 0;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your savings or spending goal.'
              : 'Set a goal to help you save or manage spending for this category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector (only show if not pre-selected) */}
          {!initialCategoryId && categories.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value || '')}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Goal Type Selector */}
          <div className="space-y-2">
            <label htmlFor="goalType" className="text-sm font-medium">
              Goal Type
            </label>
            <Select value={goalType} onValueChange={(value) => value && setGoalType(value as GoalType)}>
              <SelectTrigger id="goalType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGoalType && (
              <p className="text-xs text-muted-foreground">{selectedGoalType.description}</p>
            )}
          </div>

          {/* Target Amount (for target_balance types) */}
          {(goalType === 'target_balance' || goalType === 'target_balance_by_date') && (
            <div className="space-y-2">
              <label htmlFor="targetAmount" className="text-sm font-medium">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000.00"
                  className="pl-7"
                  required
                  autoFocus={!initialCategoryId}
                />
              </div>
            </div>
          )}

          {/* Target Date (for target_balance_by_date) */}
          {goalType === 'target_balance_by_date' && (
            <div className="space-y-2">
              <label htmlFor="targetDate" className="text-sm font-medium">
                Target Date
              </label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          )}

          {/* Monthly Funding (for monthly_funding and spending_monthly) */}
          {(goalType === 'monthly_funding' || goalType === 'spending_monthly') && (
            <div className="space-y-2">
              <label htmlFor="monthlyFunding" className="text-sm font-medium">
                {goalType === 'monthly_funding' ? 'Monthly Amount' : 'Monthly Limit'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="monthlyFunding"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyFunding}
                  onChange={(e) => setMonthlyFunding(e.target.value)}
                  placeholder="500.00"
                  className="pl-7"
                  required
                  autoFocus={!initialCategoryId}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {goalType === 'monthly_funding'
                  ? 'Amount to save each month'
                  : 'Maximum amount to spend each month'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid()}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
