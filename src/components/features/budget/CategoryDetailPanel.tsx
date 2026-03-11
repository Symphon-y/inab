'use client';

import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvailableBalanceSection } from './AvailableBalanceSection';
import { TargetSection, type GoalData } from './TargetSection';
import { AutoAssignSection } from './AutoAssignSection';
import { NotesSection } from './NotesSection';
import type { Category, Goal } from '@/db/schema';
import type { BudgetHistory } from '@/lib/auto-assign';

interface BudgetAllocation {
  assigned: number;
  activity: number;
  available: number;
  carryover: number;
}

interface CategoryDetailPanelProps {
  category: Category | null;
  allocation: BudgetAllocation | null;
  goal: Goal | null;
  history: BudgetHistory | null;
  onAssignMoney: (category: Category, amount?: number) => void;
  onCreateGoal: (categoryId: string, goalData: GoalData) => void;
  onEditGoal: (goal: Goal, goalData: GoalData) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditCategory: (category: Category) => void;
}

export function CategoryDetailPanel({
  category,
  allocation,
  goal,
  history,
  onAssignMoney,
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
  onEditCategory,
}: CategoryDetailPanelProps) {
  const handleSaveNote = async (note: string) => {
    // Update category note via API
    try {
      const response = await fetch(`/api/categories/${category?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleSaveTarget = (goalData: GoalData) => {
    if (!category) return;

    if (goal) {
      onEditGoal(goal, goalData);
    } else {
      onCreateGoal(category.id, goalData);
    }
  };

  const handleDeleteTarget = () => {
    if (goal) {
      onDeleteGoal(goal.id);
    }
  };

  const handleAutoAssign = (amount: number, label: string) => {
    if (category) {
      onAssignMoney(category, amount);
    }
  };

  if (!category || !allocation) {
    return (
      <aside className="w-96 border-l bg-background flex flex-col h-full">
        <div className="flex items-center justify-center h-full p-6 text-center">
          <div>
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Select a category to view details</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon || '📁'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{category.name}</h2>
            {category.note && (
              <p className="text-sm text-muted-foreground mt-1">{category.note}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <AvailableBalanceSection allocation={allocation} history={history} />

          <TargetSection
            goal={goal}
            currentAvailable={allocation.available}
            onSaveTarget={handleSaveTarget}
            onDeleteTarget={handleDeleteTarget}
          />

          <AutoAssignSection
            goal={goal}
            allocation={allocation}
            history={history}
            onAutoAssign={handleAutoAssign}
          />

          <NotesSection
            categoryId={category.id}
            note={category.note}
            onSaveNote={handleSaveNote}
          />
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4 flex gap-2">
        <Button type="button" onClick={() => onAssignMoney(category)} className="flex-1">
          <DollarSign className="mr-2 h-4 w-4" />
          Assign Money
        </Button>
        <Button type="button" variant="outline" onClick={() => onEditCategory(category)}>
          Edit
        </Button>
      </div>
    </aside>
  );
}
