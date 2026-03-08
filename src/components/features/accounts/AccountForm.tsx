'use client';

import { useState } from 'react';
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
import type { Account, AccountType } from '@/db/schema';

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  onSubmit: (data: AccountFormData) => Promise<void>;
}

export interface AccountFormData {
  name: string;
  accountType: AccountType;
  balance: number;
  isOnBudget: boolean;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'line_of_credit', label: 'Line of Credit' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

export function AccountForm({ open, onOpenChange, account, onSubmit }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(account?.name ?? '');
  const [accountType, setAccountType] = useState<AccountType>(account?.accountType ?? 'checking');
  const [balance, setBalance] = useState(account ? (account.balance / 100).toFixed(2) : '0.00');
  const [isOnBudget, setIsOnBudget] = useState(account?.isOnBudget ?? true);

  const isEditing = !!account;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        name,
        accountType,
        balance: Math.round(parseFloat(balance) * 100),
        isOnBudget,
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setAccountType('checking');
      setBalance('0.00');
      setIsOnBudget(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Add Account'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the account details below.'
              : 'Enter the details for your new account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Account Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Account Type
            </label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">
                Current Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOnBudget"
              checked={isOnBudget}
              onChange={(e) => setIsOnBudget(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isOnBudget" className="text-sm">
              Track in budget (uncheck for tracking-only accounts)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
