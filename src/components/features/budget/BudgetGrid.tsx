'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CategoryListPanel } from './CategoryListPanel';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { ReadyToAssignCard } from './ReadyToAssignCard';
import { CategoryGroupForm, CategoryForm } from '@/components/features/categories';
import { GoalForm, type GoalFormData } from '@/components/features/goals';
import { AssignMoneyDialog } from './AssignMoneyDialog';
import { BudgetGridSkeleton } from './BudgetGridSkeleton';
import type { CategoryGroupFormData, CategoryFormData } from '@/components/features/categories';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { CategoryGroup, Category, Goal } from '@/db/schema';
import type { BudgetHistory } from '@/lib/auto-assign';
import type { GoalData } from './TargetSection';

interface CategoryGroupWithCategories extends CategoryGroup {
  categories: Category[];
}

interface CategoryWithAllocations extends Category {
  assigned: number;
  activity: number;
  available: number;
}

interface BudgetGridProps {
  year: number;
  month: number;
  onRefreshSummary?: () => void;
}

export function BudgetGrid({ year, month, onRefreshSummary }: BudgetGridProps) {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupWithCategories[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, any>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetHistory, setBudgetHistory] = useState<BudgetHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected category for detail panel
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Form states
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Assign money dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningCategory, setAssigningCategory] = useState<Category | null>(null);

  // Goal form states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [settingGoalCategory, setSettingGoalCategory] = useState<Category | null>(null);

  // Delete confirmation states
  const [groupToDelete, setGroupToDelete] = useState<CategoryGroup | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategoryGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/category-groups');
      if (res.ok) {
        const data = await res.json();
        setCategoryGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch category groups:', error);
    }
  }, []);

  const fetchBudgetAllocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/budget/allocations?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        // Create a map of categoryId -> allocation
        const allocationsMap: Record<string, any> = {};
        data.forEach((allocation: any) => {
          allocationsMap[allocation.categoryId] = allocation;
        });
        setBudgetAllocations(allocationsMap);
      }
    } catch (error) {
      console.error('Failed to fetch budget allocations:', error);
    }
  }, [year, month]);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  }, []);

  const fetchBudgetHistory = useCallback(
    async (categoryId: string) => {
      try {
        const res = await fetch(
          `/api/categories/${categoryId}/budget-history?year=${year}&month=${month}`
        );
        if (res.ok) {
          const data = await res.json();
          setBudgetHistory(data);
        }
      } catch (error) {
        console.error('Failed to fetch budget history:', error);
      }
    },
    [year, month]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchCategoryGroups(), fetchBudgetAllocations(), fetchGoals()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchCategoryGroups, fetchBudgetAllocations, fetchGoals]);

  // Fetch budget history when selected category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchBudgetHistory(selectedCategoryId);
    } else {
      setBudgetHistory(null);
    }
  }, [selectedCategoryId, fetchBudgetHistory]);

  const handleAddGroup = () => {
    setEditingGroup(null);
    setShowGroupForm(true);
  };

  const handleEditGroup = (group: CategoryGroup) => {
    setEditingGroup(group);
    setShowGroupForm(true);
  };

  const handleDeleteGroup = (group: CategoryGroup) => {
    setGroupToDelete(group);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      const res = await fetch(`/api/category-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategoryGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
        setGroupToDelete(null);
        toast.success('Category group deleted successfully');
      } else {
        toast.error('Failed to delete category group');
      }
    } catch (error) {
      toast.error('Failed to delete category group');
    }
  };

  const handleSubmitGroup = async (data: CategoryGroupFormData) => {
    try {
      if (editingGroup) {
        // Update existing group
        const res = await fetch(`/api/category-groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const updated = await res.json();
          setCategoryGroups((prev) =>
            prev.map((g) => (g.id === editingGroup.id ? { ...updated, categories: g.categories } : g))
          );
          toast.success('Category group updated successfully');
        } else {
          toast.error('Failed to update category group');
        }
      } else {
        // Create new group
        const res = await fetch('/api/category-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const newGroup = await res.json();
          setCategoryGroups((prev) => [...prev, newGroup]);
          toast.success('Category group created successfully');
        } else {
          toast.error('Failed to create category group');
        }
      }
    } catch (error) {
      toast.error(editingGroup ? 'Failed to update category group' : 'Failed to create category group');
    }
  };

  const handleAddCategory = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setActiveGroupId(category.categoryGroupId);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategoryGroups((prev) =>
          prev.map((g) => ({
            ...g,
            categories: g.categories.filter((c) => c.id !== categoryToDelete.id),
          }))
        );
        setCategoryToDelete(null);
        toast.success('Category deleted successfully');
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleSubmitCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const updated = await res.json();
          setCategoryGroups((prev) =>
            prev.map((g) => ({
              ...g,
              categories: g.categories.map((c) => (c.id === editingCategory.id ? updated : c)),
            }))
          );
          toast.success('Category updated successfully');
        } else {
          toast.error('Failed to update category');
        }
      } else {
        // Create new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const newCategory = await res.json();
          setCategoryGroups((prev) =>
            prev.map((g) =>
              g.id === data.categoryGroupId
                ? { ...g, categories: [...g.categories, newCategory] }
                : g
            )
          );
          toast.success('Category created successfully');
        } else {
          toast.error('Failed to create category');
        }
      }
    } catch (error) {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const handleAssignToCategory = (category: Category, amount?: number) => {
    if (amount !== undefined) {
      // Auto-assign with specific amount
      handleAssignMoney(category.id, amount);
    } else {
      // Open dialog for manual assignment
      setAssigningCategory(category);
      setShowAssignDialog(true);
    }
  };

  const handleAssignMoney = async (categoryId: string, amountInCents: number) => {
    try {
      // Get current allocation to add to it (not replace it)
      const currentAssigned = budgetAllocations[categoryId]?.assigned || 0;
      const newAssigned = currentAssigned + amountInCents;

      const res = await fetch('/api/budget/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          year,
          month,
          assigned: newAssigned,
        }),
      });

      if (res.ok) {
        // Refresh allocations and history
        await fetchBudgetAllocations();
        if (selectedCategoryId === categoryId) {
          await fetchBudgetHistory(categoryId);
        }
        // Trigger refresh of Ready to Assign card
        if (onRefreshSummary) {
          onRefreshSummary();
        }
        toast.success('Money assigned successfully');
      } else {
        toast.error('Failed to assign money');
      }
    } catch (error) {
      console.error('Failed to assign money:', error);
      toast.error('Failed to assign money');
    }
  };

  const handleSetGoal = (category: Category) => {
    setSettingGoalCategory(category);
    setShowGoalForm(true);
  };

  const handleCreateOrUpdateGoal = async (categoryId: string, goalData: GoalData, existingGoalId?: string) => {
    const apiData = {
      categoryId,
      goalType: goalData.goalType,
      targetAmount: goalData.targetAmount,
      targetDate: goalData.targetDate,
      monthlyFunding: goalData.monthlyFunding,
    };

    try {
      if (existingGoalId) {
        // Update existing goal
        const res = await fetch(`/api/goals/${existingGoalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        });

        if (res.ok) {
          const updated = await res.json();
          setGoals((prev) => prev.map((g) => (g.id === existingGoalId ? updated : g)));
          toast.success('Target updated successfully');
        } else {
          toast.error('Failed to update target');
        }
      } else {
        // Create new goal
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        });

        if (res.ok) {
          const newGoal = await res.json();
          setGoals((prev) => [...prev, newGoal]);
          toast.success('Target created successfully');
        } else {
          toast.error('Failed to create target');
        }
      }
    } catch (error) {
      toast.error(existingGoalId ? 'Failed to update target' : 'Failed to create target');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        toast.success('Target deleted successfully');
      } else {
        toast.error('Failed to delete target');
      }
    } catch (error) {
      toast.error('Failed to delete target');
    }
  };

  const handleSubmitGoal = async (data: GoalFormData) => {
    if (!settingGoalCategory) return;

    const existingGoal = goals.find((g) => g.categoryId === settingGoalCategory.id && g.isActive);

    try {
      if (existingGoal) {
        // Update existing goal
        const res = await fetch(`/api/goals/${existingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const updated = await res.json();
          setGoals((prev) => prev.map((g) => (g.id === existingGoal.id ? updated : g)));
          toast.success('Goal updated successfully');
        } else {
          toast.error('Failed to update goal');
        }
      } else {
        // Create new goal
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const newGoal = await res.json();
          setGoals((prev) => [...prev, newGoal]);
          toast.success('Goal created successfully');
        } else {
          toast.error('Failed to create goal');
        }
      }
    } catch (error) {
      toast.error(existingGoal ? 'Failed to update goal' : 'Failed to create goal');
    }
  };

  // Convert categories to include allocation data
  const getCategoriesWithAllocations = (categories: Category[]): CategoryWithAllocations[] => {
    return categories.map((cat) => {
      const allocation = budgetAllocations[cat.id];
      return {
        ...cat,
        assigned: allocation?.assigned || 0,
        activity: allocation?.activity || 0,
        available: allocation?.available || 0,
      };
    });
  };

  // Get goal for a category
  const getGoalForCategory = (categoryId: string): Goal | null => {
    return goals.find((g) => g.categoryId === categoryId && g.isActive) || null;
  };

  // Get selected category and its data
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    for (const group of categoryGroups) {
      const cat = group.categories.find((c) => c.id === selectedCategoryId);
      if (cat) return cat;
    }
    return null;
  }, [categoryGroups, selectedCategoryId]);

  const selectedAllocation = useMemo(() => {
    if (!selectedCategoryId) return null;
    const allocation = budgetAllocations[selectedCategoryId];
    if (!allocation) {
      return {
        assigned: 0,
        activity: 0,
        available: 0,
        carryover: 0,
      };
    }
    return allocation;
  }, [budgetAllocations, selectedCategoryId]);

  const selectedGoal = useMemo(() => {
    if (!selectedCategoryId) return null;
    return getGoalForCategory(selectedCategoryId);
  }, [selectedCategoryId, goals]);

  if (loading) {
    return <BudgetGridSkeleton />;
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
        {/* Middle - Category List */}
        {categoryGroups.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center border-r">
            <div>
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create category groups and categories to start budgeting. Organize your spending and assign money to each category.
              </p>
              <Button onClick={handleAddGroup}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category Group
              </Button>
            </div>
          </div>
        ) : (
          <>
            <CategoryListPanel
              categoryGroups={categoryGroups}
              goals={goals}
              budgetAllocations={budgetAllocations}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onAddGroup={handleAddGroup}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onSetGoal={handleSetGoal}
              onAssignToCategory={handleAssignToCategory}
            />

            {/* Right Panel - Category Details */}
            <CategoryDetailPanel
              category={selectedCategory}
              allocation={selectedAllocation}
              goal={selectedGoal}
              history={budgetHistory}
              onAssignMoney={handleAssignToCategory}
              onCreateGoal={(categoryId, goalData) => {
                handleCreateOrUpdateGoal(categoryId, goalData);
              }}
              onEditGoal={(goal, goalData) => {
                handleCreateOrUpdateGoal(goal.categoryId, goalData, goal.id);
              }}
              onDeleteGoal={handleDeleteGoal}
              onEditCategory={handleEditCategory}
            />
          </>
        )}
      </div>

      {/* Forms */}
      <CategoryGroupForm
        open={showGroupForm}
        onOpenChange={setShowGroupForm}
        categoryGroup={editingGroup}
        onSubmit={handleSubmitGroup}
      />

      <CategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        category={editingCategory}
        categoryGroupId={activeGroupId}
        onSubmit={handleSubmitCategory}
      />

      <AssignMoneyDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        category={assigningCategory}
        currentAssigned={assigningCategory ? (budgetAllocations[assigningCategory.id]?.assigned || 0) : 0}
        year={year}
        month={month}
        onSubmit={handleAssignMoney}
      />

      <GoalForm
        open={showGoalForm}
        onOpenChange={setShowGoalForm}
        goal={settingGoalCategory ? getGoalForCategory(settingGoalCategory.id) : null}
        categoryId={settingGoalCategory?.id}
        onSubmit={handleSubmitGoal}
      />

      {/* Delete Confirmations */}
      <ConfirmDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
        title="Delete Category Group"
        description={`Are you sure you want to delete "${groupToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDeleteGroup}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This will also delete all budget history for this category. This action cannot be undone.`}
        onConfirm={confirmDeleteCategory}
        confirmLabel="Delete"
        variant="destructive"
      />
    </>
  );
}
