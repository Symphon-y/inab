'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/components/providers/plan-provider';
import { PlanCard } from '@/components/features/plans/PlanCard';
import { CreatePlanCard } from '@/components/features/plans/CreatePlanCard';
import { PlanForm } from '@/components/features/plans/PlanForm';
import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlansPage() {
  const { plans, refreshPlans, setActivePlanId } = usePlan();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    await setActivePlanId(planId);
    router.push('/budget');
  };

  const handleCreatePlan = async (data: { name: string; icon: string }) => {
    const response = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const newPlan = await response.json();
      await refreshPlans();
      await setActivePlanId(newPlan.id);
      router.push('/budget');
    }
  };

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md text-center">
          <FolderOpen className="mx-auto h-24 w-24 text-muted-foreground/50 mb-6" />
          <h1 className="text-3xl font-bold mb-2">Create Your First Plan</h1>
          <p className="text-muted-foreground mb-8">
            Plans help you organize multiple budgets. Each plan has its own
            categories, accounts, and transactions.
          </p>
          <Button size="lg" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Create First Plan
          </Button>
        </div>

        <PlanForm
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreatePlan}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Plans</h1>
        <p className="text-muted-foreground">
          Select a plan to manage or create a new one
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={() => handleSelectPlan(plan.id)}
            onRefresh={refreshPlans}
          />
        ))}

        <CreatePlanCard onClick={() => setShowCreateDialog(true)} />
      </div>

      <PlanForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePlan}
      />
    </div>
  );
}
