'use client';

import { useEffect, useState, useMemo } from 'react';
import { Target, Plus, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GoalCard } from '@/components/features/goals/GoalCard';
import { GoalForm, type GoalFormData } from '@/components/features/goals';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { formatCurrency, getGoalStatus, calculateGoalProgress } from '@/lib/goals';
import type { Goal, Category } from '@/db/schema';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'active' | 'completed';

interface GoalWithCategory extends Goal {
  category: Category;
  currentBalance: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');

  // Goal form states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Delete confirmation state
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch goals, categories, and current budget allocations in parallel
      const [goalsRes, categoriesRes, allocationsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/category-groups'),
        fetch(`/api/budget/allocations?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
      ]);

      if (goalsRes.ok && categoriesRes.ok && allocationsRes.ok) {
        const goalsData = await goalsRes.json();
        const categoryGroupsData = await categoriesRes.json();
        const allocationsData = await allocationsRes.json();

        // Flatten categories from category groups
        const allCategories: Category[] = categoryGroupsData.flatMap((group: any) => group.categories);
        setCategories(allCategories);

        // Create allocations map
        const allocationsMap: Record<string, any> = {};
        allocationsData.forEach((allocation: any) => {
          allocationsMap[allocation.categoryId] = allocation;
        });
        setBudgetAllocations(allocationsMap);

        // Combine goals with their categories and current balances
        const goalsWithCategories: GoalWithCategory[] = goalsData
          .map((goal: Goal) => {
            const category = allCategories.find((c) => c.id === goal.categoryId);
            const allocation = allocationsMap[goal.categoryId];
            return {
              ...goal,
              category,
              currentBalance: allocation?.available || 0,
            };
          })
          .filter((goal: any) => goal.category); // Filter out goals with missing categories

        setGoals(goalsWithCategories);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      const res = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== goalToDelete.id));
        setGoalToDelete(null);
        toast.success('Goal deleted successfully');
      } else {
        toast.error('Failed to delete goal');
      }
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const handleSubmitGoal = async (data: GoalFormData) => {
    try {
      if (editingGoal) {
        // Update existing goal
        const res = await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await fetchData(); // Refresh all data
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
          await fetchData(); // Refresh all data
          toast.success('Goal created successfully');
        } else {
          toast.error('Failed to create goal');
        }
      }
    } catch (error) {
      toast.error(editingGoal ? 'Failed to update goal' : 'Failed to create goal');
    }
  };

  // Filter goals
  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;

    return goals.filter((goal) => {
      const status = getGoalStatus(goal, goal.currentBalance);
      if (filter === 'completed') {
        return status === 'complete';
      } else {
        return status !== 'complete';
      }
    });
  }, [goals, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => getGoalStatus(g, g.currentBalance) === 'complete').length;
    const active = total - completed;
    const totalSaved = goals.reduce((sum, g) => sum + g.currentBalance, 0);
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);

    return { total, completed, active, totalSaved, totalTarget };
  }, [goals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track your savings goals and spending limits
          </p>
        </div>
        <Button onClick={handleCreateGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
              <p className="text-3xl font-bold mt-2">{stats.active}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold mt-2">{stats.completed}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalSaved)}</p>
              {stats.totalTarget > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  of {formatCurrency(stats.totalTarget)}
                </p>
              )}
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          All Goals ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            filter === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            filter === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'completed' ? 'No completed goals yet' : 'No goals yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {filter === 'completed'
              ? 'Keep working on your active goals to see them here when completed.'
              : 'Create your first goal to start tracking your savings and spending targets.'}
          </p>
          {filter === 'active' && (
            <Button onClick={handleCreateGoal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              category={goal.category}
              currentBalance={goal.currentBalance}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        open={showGoalForm}
        onOpenChange={setShowGoalForm}
        goal={editingGoal}
        categories={categories}
        onSubmit={handleSubmitGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!goalToDelete}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
        title="Delete Goal"
        description={`Are you sure you want to delete this goal? This action cannot be undone.`}
        onConfirm={confirmDeleteGoal}
        variant="destructive"
      />
    </div>
  );
}
