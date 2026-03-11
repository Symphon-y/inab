'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Goal } from '@/db/schema';

interface TargetSectionProps {
  goal: Goal | null;
  currentAvailable: number;
  onSaveTarget: (data: GoalData) => void;
  onDeleteTarget: () => void;
}

export interface GoalData {
  goalType: 'monthly_funding' | 'target_balance_by_date';
  targetAmount?: number;
  targetDate?: Date;
  monthlyFunding?: number;
  weeklyAmount?: number;
  weekday?: string;
}

export function TargetSection({
  goal,
  currentAvailable,
  onSaveTarget,
  onDeleteTarget,
}: TargetSectionProps) {
  // Determine initial tab based on goal
  const getInitialTab = (): string => {
    if (!goal) return 'monthly';

    if (goal.goalType === 'target_balance_by_date') {
      // Check if it's a yearly target (Dec 31)
      if (goal.targetDate) {
        const date = new Date(goal.targetDate);
        if (date.getMonth() === 11 && date.getDate() === 31) {
          return 'yearly';
        }
      }
      return 'custom';
    }

    // For monthly_funding, check if it could be weekly
    // We'll default to monthly for existing goals
    return 'monthly';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [amount, setAmount] = useState<string>('');
  const [weekday, setWeekday] = useState<string>('saturday');
  const [targetDate, setTargetDate] = useState<string>('');

  // Initialize form values from goal
  useEffect(() => {
    if (goal) {
      if (goal.goalType === 'monthly_funding' && goal.monthlyFunding) {
        const monthlyAmount = goal.monthlyFunding / 100;
        setAmount(monthlyAmount.toFixed(2));
      } else if (goal.goalType === 'target_balance_by_date') {
        if (goal.targetAmount) {
          setAmount((goal.targetAmount / 100).toFixed(2));
        }
        if (goal.targetDate) {
          setTargetDate(goal.targetDate.toISOString().split('T')[0]);
        }
      }
    }
  }, [goal]);

  const handleSave = () => {
    const amountCents = Math.round(parseFloat(amount || '0') * 100);

    switch (activeTab) {
      case 'weekly': {
        // Convert weekly to monthly (weekly * 4.33)
        const monthlyFunding = Math.round(amountCents * 4.33);
        onSaveTarget({
          goalType: 'monthly_funding',
          monthlyFunding,
          weeklyAmount: amountCents,
          weekday,
        });
        break;
      }
      case 'monthly': {
        onSaveTarget({
          goalType: 'monthly_funding',
          monthlyFunding: amountCents,
        });
        break;
      }
      case 'yearly': {
        // Set target date to Dec 31 of current year
        const year = new Date().getFullYear();
        const dec31 = new Date(year, 11, 31);
        onSaveTarget({
          goalType: 'target_balance_by_date',
          targetAmount: amountCents,
          targetDate: dec31,
        });
        break;
      }
      case 'custom': {
        if (!targetDate) return;
        onSaveTarget({
          goalType: 'target_balance_by_date',
          targetAmount: amountCents,
          targetDate: new Date(targetDate),
        });
        break;
      }
    }
  };

  const handleCancel = () => {
    // Reset form to goal values
    if (goal) {
      if (goal.goalType === 'monthly_funding' && goal.monthlyFunding) {
        setAmount((goal.monthlyFunding / 100).toFixed(2));
      } else if (goal.goalType === 'target_balance_by_date' && goal.targetAmount) {
        setAmount((goal.targetAmount / 100).toFixed(2));
      }
    } else {
      setAmount('');
      setTargetDate('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Target
        </h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">I need</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Every</label>
            <Select value={weekday} onValueChange={(value) => setWeekday(value || 'saturday')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
            Next month I want to set aside ${amount || '0'}/week
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">I need</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Every month</div>
          <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
            Next month I want to set aside ${amount || '0'}
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">I need</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="1800.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            By December 31, {new Date().getFullYear()}
          </div>
          <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
            Target: ${amount || '0'} by end of year
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">I need</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">By</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
            {targetDate
              ? `Target: $${amount || '0'} by ${new Date(targetDate).toLocaleDateString()}`
              : 'Set a target amount and date'}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-2">
        {goal && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDeleteTarget}
            className="flex-1"
          >
            Delete
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} className="flex-1">
          Save Target
        </Button>
      </div>
    </div>
  );
}
