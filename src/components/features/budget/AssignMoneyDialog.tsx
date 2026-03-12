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
import type { Category } from '@/db/schema';

interface AssignMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  currentAssigned: number; // Amount in cents
  year: number;
  month: number;
  onSubmit: (categoryId: string, amount: number) => Promise<void>;
}

export function AssignMoneyDialog({
  open,
  onOpenChange,
  category,
  currentAssigned,
  year,
  month,
  onSubmit,
}: AssignMoneyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (category && open) {
      // Initialize with current assigned amount
      setAmount((currentAssigned / 100).toFixed(2));
    }
  }, [category, currentAssigned, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setLoading(true);
    try {
      const amountInCents = dollarsToCents(amount);
      await onSubmit(category.id, amountInCents);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = async (quickAmount: number) => {
    if (!category) return;

    setLoading(true);
    try {
      const newAmount = currentAssigned + quickAmount;
      await onSubmit(category.id, newAmount);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Money to {category.name}</DialogTitle>
          <DialogDescription>
            Enter the amount you want to assign to this category for{' '}
            {new Date(year, month - 1).toLocaleDateString('default', {
              month: 'long',
              year: 'numeric',
            })}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Assigned Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Quick Assign Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Quick Assign</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAssign(10000)} // $100
                disabled={loading}
              >
                +$100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAssign(25000)} // $250
                disabled={loading}
              >
                +$250
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAssign(50000)} // $500
                disabled={loading}
              >
                +$500
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAssign(100000)} // $1000
                disabled={loading}
              >
                +$1000
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount}>
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
