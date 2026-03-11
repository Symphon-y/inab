'use client';

import { useRouter } from 'next/navigation';
import { usePlan } from '@/components/providers/plan-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown, Settings2 } from 'lucide-react';

export function PlanSwitcher() {
  const { activePlan, plans, setActivePlanId } = usePlan();
  const router = useRouter();

  const handleSwitchPlan = async (planId: string) => {
    await setActivePlanId(planId);
    router.push('/budget');
  };

  if (!activePlan) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full">
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2 truncate">
            <span className="text-xl">{activePlan.icon}</span>
            <span className="truncate">{activePlan.name}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {plans.map((plan) => (
          <DropdownMenuItem
            key={plan.id}
            onClick={() => handleSwitchPlan(plan.id)}
            className={plan.id === activePlan.id ? 'bg-accent' : ''}
          >
            <span className="text-xl mr-2">{plan.icon}</span>
            <span className="truncate">{plan.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/plans')}>
          <Settings2 className="mr-2 h-4 w-4" />
          Manage Plans
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
