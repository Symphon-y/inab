'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TransactionList, TransactionForm } from '@/components/features/transactions';
import type { TransactionFormData } from '@/components/features/transactions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Transaction, Account } from '@/db/schema';

interface TransactionWithCategory extends Transaction {
  categoryName?: string;
}

interface AccountTransactionsProps {
  account: Account;
  onBalanceUpdate?: () => void;
}

export function AccountTransactions({ account, onBalanceUpdate }: AccountTransactionsProps) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions?accountId=${account.id}`);
      if (res.ok) {
        const data = await res.json();

        // Fetch category names for each transaction
        const transactionsWithCategories = await Promise.all(
          data.map(async (t: Transaction) => {
            if (t.categoryId) {
              try {
                const catRes = await fetch(`/api/categories/${t.categoryId}`);
                if (catRes.ok) {
                  const category = await catRes.json();
                  return { ...t, categoryName: category.name };
                }
              } catch (error) {
                console.error('Failed to fetch category:', error);
              }
            }
            return t;
          })
        );

        setTransactions(transactionsWithCategories);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [account.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const res = await fetch(`/api/transactions/${transactionToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
        setTransactionToDelete(null);
        toast.success('Transaction deleted successfully');
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleStatusToggle = useCallback(async (transactionId: string, newStatus: 'cleared' | 'uncleared') => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh transactions to get updated balances
      await fetchTransactions();

      // Notify parent to refresh account balance display
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }

      toast.success(`Transaction ${newStatus === 'cleared' ? 'cleared' : 'uncleared'}`);
    } catch (error) {
      console.error('Failed to toggle transaction status:', error);
      toast.error('Failed to update transaction status');
    }
  }, [fetchTransactions, onBalanceUpdate]);

  const handleSubmitTransaction = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await fetchTransactions(); // Refresh list
          toast.success('Transaction updated successfully');
        } else {
          toast.error('Failed to update transaction');
        }
      } else {
        // Create new transaction
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await fetchTransactions(); // Refresh list
          toast.success('Transaction created successfully');
        } else {
          toast.error('Failed to create transaction');
        }
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      toast.error(editingTransaction ? 'Failed to update transaction' : 'Failed to create transaction');
    }
  };

  return (
    <>
      <TransactionList
        transactions={transactions}
        accountBalance={account.balance}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onStatusToggle={handleStatusToggle}
        loading={loading}
      />

      <TransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        transaction={editingTransaction}
        accountId={account.id}
        onSubmit={handleSubmitTransaction}
      />

      <ConfirmDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        onConfirm={confirmDeleteTransaction}
        variant="destructive"
      />
    </>
  );
}
