'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionStatus, TransactionFlag } from '@/db/schema';

interface TransactionWithCategory extends Transaction {
  categoryName?: string;
}

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  accountBalance: number;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  loading?: boolean;
}

export function TransactionList({
  transactions,
  accountBalance,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  loading = false,
}: TransactionListProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(cents) / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFlagColor = (flag: TransactionFlag) => {
    const colors: Record<TransactionFlag, string> = {
      none: '',
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
    };
    return colors[flag];
  };

  const getStatusBadge = (status: TransactionStatus) => {
    if (status === 'cleared') {
      return <span className="text-xs text-green-600">✓</span>;
    }
    if (status === 'reconciled') {
      return <span className="text-xs text-blue-600">R</span>;
    }
    return null;
  };

  // Calculate running balance
  let runningBalance = accountBalance;
  const transactionsWithBalance = [...transactions].reverse().map((t) => {
    const balanceAfter = runningBalance;
    runningBalance -= t.amount;
    return { ...t, runningBalance: balanceAfter };
  }).reverse();

  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          <p>No transactions yet.</p>
          <p className="mt-2 text-sm">Add your first transaction to get started.</p>
          <Button className="mt-4" onClick={onAddTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Button onClick={onAddTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead className="text-right">Outflow</TableHead>
              <TableHead className="text-right">Inflow</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="group hover:bg-muted/50"
              >
                {/* Date with Status */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(transaction.status)}
                    <span className="text-sm">{formatDate(transaction.date)}</span>
                  </div>
                </TableCell>

                {/* Payee with Flag */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {transaction.flag !== 'none' && (
                      <div
                        className={cn('h-3 w-3 rounded-full', getFlagColor(transaction.flag))}
                        title={transaction.flag}
                      />
                    )}
                    <span className="text-sm">{transaction.payee || '—'}</span>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {transaction.categoryName || 'Uncategorized'}
                  </span>
                </TableCell>

                {/* Memo */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {transaction.memo || '—'}
                  </span>
                </TableCell>

                {/* Outflow */}
                <TableCell className="text-right">
                  {transaction.amount < 0 ? (
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(transaction.amount)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Inflow */}
                <TableCell className="text-right">
                  {transaction.amount > 0 ? (
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(transaction.amount)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Running Balance */}
                <TableCell className="text-right">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(transaction.runningBalance)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEditTransaction(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteTransaction(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
