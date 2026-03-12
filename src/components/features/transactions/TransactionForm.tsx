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
import { CategorySelect } from './CategorySelect';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionStatus, TransactionFlag } from '@/db/schema';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  accountId: string;
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

export interface TransactionFormData {
  accountId: string;
  categoryId?: string;
  payee?: string;
  amount: number; // in cents
  date: string; // YYYY-MM-DD
  memo?: string;
  status: TransactionStatus;
  flag: TransactionFlag;
}

const transactionFlags: { value: TransactionFlag; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: '' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
];

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  accountId,
  onSubmit,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'outflow' | 'inflow'>('outflow');
  const [payee, setPayee] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('uncleared');
  const [flag, setFlag] = useState<TransactionFlag>('none');

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction && open) {
      setTransactionType(transaction.amount < 0 ? 'outflow' : 'inflow');
      setPayee(transaction.payee || '');
      setCategoryId(transaction.categoryId || '');
      setAmount((Math.abs(transaction.amount) / 100).toFixed(2));
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setMemo(transaction.memo || '');
      setStatus(transaction.status);
      setFlag(transaction.flag);
    } else if (!transaction && open) {
      // Reset form for new transaction
      setTransactionType('outflow');
      setPayee('');
      setCategoryId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]); // Today's date
      setMemo('');
      setStatus('uncleared');
      setFlag('none');
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountInCents = dollarsToCents(amount);
      const finalAmount = transactionType === 'outflow' ? -amountInCents : amountInCents;

      await onSubmit({
        accountId,
        categoryId: categoryId || undefined,
        payee: payee.trim() || undefined,
        amount: finalAmount,
        date,
        memo: memo.trim() || undefined,
        status,
        flag,
      });

      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the transaction details below.'
              : 'Enter the details for your new transaction.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transactionType === 'outflow' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTransactionType('outflow')}
            >
              Outflow
            </Button>
            <Button
              type="button"
              variant={transactionType === 'inflow' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTransactionType('inflow')}
            >
              Inflow
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount
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
                  required
                />
              </div>
            </div>
          </div>

          {/* Payee */}
          <div className="space-y-2">
            <label htmlFor="payee" className="text-sm font-medium">
              Payee
            </label>
            <Input
              id="payee"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="Who did you pay or receive money from?"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <CategorySelect
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Select a category"
            />
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <label htmlFor="memo" className="text-sm font-medium">
              Memo <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note about this transaction"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncleared">Uncleared</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flag */}
            <div className="space-y-2">
              <label htmlFor="flag" className="text-sm font-medium">
                Flag
              </label>
              <Select value={flag} onValueChange={(v) => setFlag(v as TransactionFlag)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionFlags.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex items-center gap-2">
                        {f.color && (
                          <div className={cn('h-3 w-3 rounded-full', f.color)} />
                        )}
                        <span>{f.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !date}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
