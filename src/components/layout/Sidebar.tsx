'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Wallet,
  PiggyBank,
  Target,
  TrendingUp,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AccountItem } from '@/components/features/accounts';
import { AccountForm, AccountFormData } from '@/components/features/accounts';
import { PlanSwitcher } from '@/components/features/plans';
import { useAccountRefresh } from '@/hooks/useAccountRefresh';
import type { Account } from '@/db/schema';
import type { AccountWithConnection } from '@/types/account';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [addingToBudget, setAddingToBudget] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { refreshAccounts, isRefreshing } = useAccountRefresh();

  const navItems = [
    { label: 'Budget', href: '/budget', icon: PiggyBank },
    { label: 'Goals', href: '/goals', icon: Target },
    { label: 'Reports', href: '/reports', icon: TrendingUp },
  ];

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/with-connections', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const budgetAccounts = accounts.filter((a) => a.isOnBudget && !a.isClosed);
  const trackingAccounts = accounts.filter((a) => !a.isOnBudget && !a.isClosed);

  const totalBudget = budgetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalTracking = trackingAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleAddAccount = (isOnBudget: boolean) => {
    setAddingToBudget(isOnBudget);
    setEditingAccount(null);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAddingToBudget(account.isOnBudget);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (account: Account) => {
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      // If we're on the deleted account's page, redirect to budget
      if (pathname === `/accounts/${account.id}`) {
        router.push('/budget');
      }
    }
  };

  const handleSubmitAccount = async (data: AccountFormData) => {
    if (editingAccount) {
      // Update existing account
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setAccounts((prev) =>
          prev.map((a) => (a.id === editingAccount.id ? updated : a))
        );
      }
    } else {
      // Create new account
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isOnBudget: addingToBudget,
        }),
      });

      if (res.ok) {
        const newAccount = await res.json();
        setAccounts((prev) => [...prev, newAccount]);
      }
    }
  };

  const handleRefreshAccounts = useCallback(async () => {
    try {
      // Filter accounts with SimpleFin connections
      const connectedAccountIds = accounts
        .filter(acc => acc.hasConnection)
        .map(acc => acc.id);

      if (connectedAccountIds.length === 0) {
        toast('No connected accounts', {
          description: 'Connect a SimpleFin account to use refresh.',
        });
        return;
      }

      await refreshAccounts(connectedAccountIds);

      // Refresh account list to show updated balances
      await fetchAccounts();

      toast.success('Accounts refreshed', {
        description: `Successfully synced ${connectedAccountIds.length} account(s)`,
      });
    } catch (error) {
      toast.error('Refresh failed', {
        description: error instanceof Error ? error.message : 'Failed to refresh accounts',
      });
    }
  }, [accounts, refreshAccounts, fetchAccounts]);

  return (
    <>
      <aside className={cn(
        'flex h-full flex-col border-r bg-muted/30 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}>
        <div className="flex h-14 items-center border-b px-4 justify-between">
          {!isCollapsed && (
            <Link href="/budget" className="flex items-center gap-2 font-semibold">
              <Wallet className="h-5 w-5" />
              <span>inab</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/budget" className="flex items-center justify-center w-full">
              <Wallet className="h-5 w-5" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', isCollapsed && 'hidden')}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          {!isCollapsed && (
            <>
              <div className="px-0 py-2">
                <PlanSwitcher />
              </div>
              <Separator className="my-2" />
            </>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </nav>

          {/* Refresh Accounts Button */}
          {!isCollapsed && accounts.some(acc => acc.hasConnection) && (
            <div className="px-0 pt-4 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleRefreshAccounts}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh Accounts
              </Button>
            </div>
          )}

          {!isCollapsed && <Separator className="my-4" />}

          {/* Budget Accounts */}
          {!isCollapsed && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Budget
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => handleAddAccount(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : budgetAccounts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No accounts</div>
            ) : (
              budgetAccounts.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                />
              ))
            )}
            {budgetAccounts.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1 text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium tabular-nums">{formatCurrency(totalBudget)}</span>
              </div>
            )}
            </div>
          )}

          {!isCollapsed && <Separator className="my-4" />}

          {/* Tracking Accounts */}
          {!isCollapsed && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Tracking
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => handleAddAccount(false)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : trackingAccounts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No accounts</div>
            ) : (
              trackingAccounts.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                />
              ))
            )}
            {trackingAccounts.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1 text-xs">
                <span className="text-muted-foreground">Total</span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    totalTracking < 0 ? 'text-destructive' : ''
                  )}
                >
                  {formatCurrency(totalTracking)}
                </span>
              </div>
            )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 space-y-2">
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Link
            href="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/settings'
                ? 'bg-muted'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && 'Settings'}
          </Link>
        </div>
      </aside>

      <AccountForm
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        account={editingAccount}
        onSubmit={handleSubmitAccount}
      />
    </>
  );
}
