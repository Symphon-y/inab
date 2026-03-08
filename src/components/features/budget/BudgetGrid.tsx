'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryGroupSection } from './CategoryGroupSection';
import { CategoryGroupForm, CategoryForm } from '@/components/features/categories';
import { AssignMoneyDialog } from './AssignMoneyDialog';
import type { CategoryGroupFormData, CategoryFormData } from '@/components/features/categories';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { CategoryGroup, Category } from '@/db/schema';

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
}

export function BudgetGrid({ year, month }: BudgetGridProps) {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupWithCategories[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Form states
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Assign money dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningCategory, setAssigningCategory] = useState<Category | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchCategoryGroups(), fetchBudgetAllocations()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchCategoryGroups, fetchBudgetAllocations]);

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

    const res = await fetch(`/api/category-groups/${groupToDelete.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setCategoryGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setGroupToDelete(null);
    }
  };

  const handleSubmitGroup = async (data: CategoryGroupFormData) => {
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
      }
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
    }
  };

  const handleSubmitCategory = async (data: CategoryFormData) => {
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
      }
    }
  };

  const handleAssignToCategory = (category: Category) => {
    setAssigningCategory(category);
    setShowAssignDialog(true);
  };

  const handleAssignMoney = async (categoryId: string, amountInCents: number) => {
    try {
      const res = await fetch('/api/budget/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          year,
          month,
          assigned: amountInCents,
        }),
      });

      if (res.ok) {
        // Refresh allocations
        await fetchBudgetAllocations();
      }
    } catch (error) {
      console.error('Failed to assign money:', error);
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

  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
          <div>Category</div>
          <div className="text-right">Assigned</div>
          <div className="text-right">Activity</div>
          <div className="text-right">Available</div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        {/* Budget Grid Header */}
        <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium sticky top-0 z-10">
          <div>Category</div>
          <div className="text-right">Assigned</div>
          <div className="text-right">Activity</div>
          <div className="text-right">Available</div>
        </div>

        {/* Category Groups and Categories */}
        {categoryGroups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No categories yet.</p>
            <p className="mt-2 text-sm">
              Create category groups and categories to start budgeting.
            </p>
            <Button className="mt-4" variant="outline" onClick={handleAddGroup}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category Group
            </Button>
          </div>
        ) : (
          <>
            {categoryGroups.map((group) => (
              <CategoryGroupSection
                key={group.id}
                group={group}
                categories={getCategoriesWithAllocations(group.categories)}
                onEditGroup={handleEditGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAssignToCategory={handleAssignToCategory}
              />
            ))}

            {/* Add Group Button */}
            <div className="p-4 border-t">
              <Button variant="outline" size="sm" onClick={handleAddGroup}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category Group
              </Button>
            </div>
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
