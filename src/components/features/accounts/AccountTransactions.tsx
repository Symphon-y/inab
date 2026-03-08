'use client';

import { useEffect, useState, useCallback } from 'react';
import { TransactionList, TransactionForm } from '@/components/features/transactions';
import type { TransactionFormData } from '@/components/features/transactions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Transaction, Account } from '@/db/schema';

interface TransactionWithCategory extends Transaction {
  categoryName?: string;
}

interface AccountTransactionsProps {
  account: Account;
}

export function AccountTransactions({ account }: AccountTransactionsProps) {
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
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleSubmitTransaction = async (data: TransactionFormData) => {
    if (editingTransaction) {
      // Update existing transaction
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchTransactions(); // Refresh list
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
      }
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
