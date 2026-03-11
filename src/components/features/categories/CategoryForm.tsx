'use client';

import { useState, useEffect } from 'react';
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
import { EmojiPicker } from '@/components/ui/emoji-picker';
import type { Category } from '@/db/schema';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  categoryGroupId: string;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

export interface CategoryFormData {
  name: string;
  categoryGroupId: string;
  icon?: string;
  note?: string;
  sortOrder?: number;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  categoryGroupId,
  onSubmit
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [note, setNote] = useState('');

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || '');
      setNote(category.note || '');
    } else {
      setName('');
      setIcon('');
      setNote('');
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        name,
        categoryGroupId: category?.categoryGroupId || categoryGroupId,
        icon: icon.trim() || undefined,
        note: note.trim() || undefined,
        sortOrder: category?.sortOrder,
      });
      onOpenChange(false);
      setName('');
      setIcon('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Create a new budget category to assign money to.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="icon" className="text-sm font-medium">
              Icon
            </label>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Category Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries, Rent, Emergency Fund"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              Note <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this category"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
