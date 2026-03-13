'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { AccountTransactions } from '@/components/features/accounts/AccountTransactions';
import { formatCurrency } from '@/lib/currency';
import { notFound } from 'next/navigation';
import type { Account } from '@/db/schema';

interface AccountPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

export default function AccountPage({ params }: AccountPageProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then(p => setAccountId(p.accountId));
  }, [params]);

  // Fetch account data
  useEffect(() => {
    if (!accountId) return;

    const fetchAccount = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts/${accountId}`);
        if (!res.ok) {
          if (res.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch account');
        }
        const data = await res.json();
        setAccount(data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const handleBalanceUpdate = () => {
    // Re-fetch account data to get updated balances
    if (!accountId) return;

    fetch(`/api/accounts/${accountId}`)
      .then(res => res.json())
      .then(data => setAccount(data))
      .catch(err => console.error('Failed to refresh account:', err));
  };

  if (loading || !account) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const balanceDisplay = (
    <div className="flex items-center gap-2">
      <span className="text-green-600">
        {formatCurrency(account.clearedBalance)}
      </span>
      <span className="text-muted-foreground">+</span>
      <span className="text-yellow-600">
        {formatCurrency(account.unclearedBalance)}
      </span>
      <span className="text-muted-foreground">=</span>
      <span className="font-semibold">
        {formatCurrency(account.balance)}
      </span>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <Header
        title={account.name}
        subtitle={balanceDisplay}
      />

      <div className="flex-1 p-6 overflow-auto">
        <AccountTransactions
          account={account}
          onBalanceUpdate={handleBalanceUpdate}
        />
      </div>
    </div>
  );
}
