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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleFinConnectionForm } from './SimpleFinConnectionForm';
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
  const [activeTab, setActiveTab] = useState<'manual' | 'simplefin'>('manual');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

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

  const handleSimpleFinAccountsSelected = async (data: {
    accessUrl: string;
    accounts: Array<{
      externalAccountId: string;
      accountName: string;
      accountType: AccountType;
      balance: number;
    }>;
    syncStartDate?: string;
  }) => {
    setLoading(true);

    const total = data.accounts.length;
    let completed = 0;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    setImportProgress({ current: 0, total });

    try {
      for (const accountData of data.accounts) {
        try {
          // Create account
          const accountResponse = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: accountData.accountName,
              accountType: accountData.accountType,
              balance: Math.round(accountData.balance),
              isOnBudget,
            }),
          });

          if (!accountResponse.ok) {
            const errorData = await accountResponse.json();
            throw new Error(errorData.error || 'Failed to create account');
          }

          const newAccount = await accountResponse.json();

          // Create connection
          await fetch(`/api/accounts/${newAccount.id}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'simplefin',
              credentials: { accessUrl: data.accessUrl },
              externalAccountId: accountData.externalAccountId,
              syncStartDate: data.syncStartDate,
            }),
          });

          // Trigger sync
          await fetch(`/api/accounts/${newAccount.id}/sync`, {
            method: 'POST',
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `${accountData.accountName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          console.error(`Failed to import account ${accountData.accountName}:`, error);
        }

        completed++;
        setImportProgress({ current: completed, total });
      }

      // Close dialog and reset form
      onOpenChange(false);
      setName('');
      setAccountType('checking');
      setBalance('0.00');
      setIsOnBudget(true);
      setActiveTab('manual');
      setImportProgress({ current: 0, total: 0 });

      // Show summary
      if (results.success > 0) {
        const message = `Successfully imported ${results.success} account${results.success !== 1 ? 's' : ''}${
          results.failed > 0 ? `. ${results.failed} failed.` : ''
        }`;
        alert(message);
      } else if (results.failed > 0) {
        alert(`Failed to import all accounts. Please check your connection and try again.`);
      }

      // Reload to refresh account list
      window.location.reload();
    } catch (error) {
      console.error('Failed to import SimpleFin accounts:', error);
      alert('Failed to import accounts. Please try again.');
      setImportProgress({ current: 0, total: 0 });
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

        {loading && importProgress.total > 0 && (
          <div className="space-y-2 pb-4">
            <div className="flex justify-between text-sm">
              <span>Importing accounts...</span>
              <span>
                {importProgress.current} / {importProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {!isEditing ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'simplefin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Account</TabsTrigger>
              <TabsTrigger value="simplefin">Connect SimpleFin</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
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
                    {loading ? 'Saving...' : 'Add Account'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="simplefin" className="space-y-4">
              <SimpleFinConnectionForm onAccountSelected={handleSimpleFinAccountsSelected} />
            </TabsContent>
          </Tabs>
        ) : (
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
