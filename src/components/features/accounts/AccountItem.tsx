'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Account } from '@/db/schema';

interface AccountItemProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => Promise<void>;
}

export function AccountItem({ account, onEdit, onDelete }: AccountItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/accounts/${account.id}`;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(account);
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
          isActive ? 'bg-muted' : 'hover:bg-muted/50'
        )}
      >
        <Link
          href={`/accounts/${account.id}`}
          className="flex flex-1 items-center gap-2"
        >
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{account.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-xs tabular-nums',
              account.balance < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {formatCurrency(account.balance)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 hover:bg-muted group-hover:opacity-100 focus:opacity-100 outline-none"
            >
              <MoreHorizontal className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account"
        description={`Are you sure you want to delete "${account.name}"? This will also delete all transactions in this account. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
