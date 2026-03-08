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
import type { CategoryGroup } from '@/db/schema';

interface CategoryGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryGroup?: CategoryGroup | null;
  onSubmit: (data: CategoryGroupFormData) => Promise<void>;
}

export interface CategoryGroupFormData {
  name: string;
  sortOrder?: number;
}

export function CategoryGroupForm({
  open,
  onOpenChange,
  categoryGroup,
  onSubmit
}: CategoryGroupFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const isEditing = !!categoryGroup;

  useEffect(() => {
    if (categoryGroup) {
      setName(categoryGroup.name);
    } else {
      setName('');
    }
  }, [categoryGroup, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        name,
        sortOrder: categoryGroup?.sortOrder,
      });
      onOpenChange(false);
      setName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category Group' : 'Add Category Group'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category group name below.'
              : 'Category groups help organize your budget categories.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Group Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Bills, Savings Goals"
              required
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
