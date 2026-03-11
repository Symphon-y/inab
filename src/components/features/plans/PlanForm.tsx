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

interface PlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; icon: string }) => Promise<void>;
  plan?: { name: string; icon: string } | null;
}

export function PlanForm({ open, onOpenChange, onSubmit, plan }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');

  const isEditing = !!plan;

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setIcon(plan.icon);
    } else {
      setName('');
      setIcon('💰');
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({ name, icon });
      onOpenChange(false);
      setName('');
      setIcon('💰');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your plan details below.'
              : 'Create a new budget plan with separate categories and accounts.'}
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
              Plan Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal, Business, Family"
              required
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : isEditing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
